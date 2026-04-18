const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

let privateConfig = {};
try {
  privateConfig = require("./config.private.js");
} catch (error) {
  privateConfig = {};
}

const db = cloud.database();
const _ = db.command;
const shippingConfig =
  (privateConfig.order && privateConfig.order.shipping) || {};

function roundCurrency(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function formatAmount(amount) {
  return roundCurrency(amount).toFixed(2);
}

function buildOrderSummary({ goodsTotalAmount, deliveryType }) {
  const freeShippingThreshold =
    Number(shippingConfig.freeShippingThreshold) || 0;
  const defaultFee = Number(shippingConfig.defaultFee) || 0;
  const normalizedDeliveryType = Number(deliveryType) === 2 ? 2 : 1;
  const shouldChargeShipping =
    normalizedDeliveryType === 1 && goodsTotalAmount < freeShippingThreshold;
  const deliveryFee = shouldChargeShipping ? defaultFee : 0;
  const promotionAmount = 0;
  const totalPayAmount = Math.max(
    0,
    goodsTotalAmount + deliveryFee - promotionAmount
  );

  return {
    totalGoodsCount: 0,
    totalSalePrice: formatAmount(goodsTotalAmount),
    deliveryFee: formatAmount(deliveryFee),
    promotionAmount: formatAmount(promotionAmount),
    totalPayAmount: formatAmount(totalPayAmount),
    invoiceSupport: true,
  };
}

exports.main = async (event, context) => {
  console.log("[createOrder] event:", event);
  const { goodsList, orderData } = event;

  // 参数校验
  if (!goodsList || !orderData) {
    console.warn("[createOrder] missing params:", { goodsList, orderData });
    return {
      success: false,
      message: "参数不完整",
    };
  }

  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  console.log("[createOrder] openId:", openId);

  // 0. 读取分销来源（记录最后一次推荐关系）
  let distributorOpenid = "";
  let distributorNickName = "";
  try {
    const userRes = await db
      .collection("user_info")
      .where({ _openid: openId })
      .limit(1)
      .get();
    const user = userRes.data && userRes.data.length ? userRes.data[0] : null;
    const referrerOpenid = user && user.referrerOpenid;
    if (referrerOpenid && referrerOpenid !== openId) {
      const distributorRes = await db
        .collection("user_info")
        .where({
          _openid: referrerOpenid,
          distributorStatus: "APPROVED",
        })
        .limit(1)
        .get();
      const distributor =
        distributorRes.data && distributorRes.data.length
          ? distributorRes.data[0]
          : null;
      if (
        distributor &&
        (distributor.role === "distributor" ||
          distributor.distributorStatus === "APPROVED")
      ) {
        distributorOpenid = referrerOpenid;
        distributorNickName = distributor.nickName || "";
      }
    }
  } catch (err) {
    console.warn("[createOrder] fetch distributor info failed:", err);
  }

  const transaction = await db.startTransaction();

  try {
    console.log(
      "[createOrder] start transaction, goods count:",
      goodsList.length
    );
    let goodsTotalAmount = 0;
    // 1. 循环处理商品库存
    // 1. 循环处理商品库存
    for (const item of goodsList) {
      if (!item.skuId || !item.quantity) continue;

      // 1.1 查询最新 SKU 库存
      // 注意：使用 goods_sku 集合，先根据 skuId (业务主键) 查询系统 _id
      console.log("[createOrder] checking stock:", {
        skuId: item.skuId,
        quantity: item.quantity,
        title: item.title,
      });
      const queryRes = await transaction
        .collection("goods_sku")
        .where({
          skuId: item.skuId,
        })
        .get();

      if (!queryRes.data || queryRes.data.length === 0) {
        throw new Error(`商品规格不存在: ${item.title}`);
      }

      const skuData = queryRes.data[0];
      const realId = skuData._id;

      // 1.2 检查库存 (字段为 stock)
      const currentStock = skuData.stock || 0;
      if (currentStock < item.quantity) {
        throw new Error(`商品 "${item.title}" 库存不足 (仅剩${currentStock})`);
      }

      // [NEW] 1.3 价格安全校验
      // 防止前端篡改价格。这里使用严格比较，允许 0.01 的浮动误差（通常不需要，但为了保险）
      // 注意：数据库存储的价格单位通常是元还是分？Deshan项目中 minSalePrice 看起来是元 (e.g. 99.00)
      // item.price 来自前端购物车，也是元。
      const dbPrice = parseFloat(skuData.price);
      const clientPrice = parseFloat(item.price);

      if (Math.abs(dbPrice - clientPrice) > 0.01) {
        console.warn(
          `[createOrder] Price mismatch for ${item.title}: DB=${dbPrice}, Client=${clientPrice}`
        );
        // 暂时记录日志，或者直接抛错拒绝订单
        throw new Error(`商品 "${item.title}" 价格变动，请重新下单`);
      }

      goodsTotalAmount = roundCurrency(
        goodsTotalAmount + dbPrice * Number(item.quantity || 0)
      );

      // 1.4 扣减库存 (使用系统 _id)
      await transaction
        .collection("goods_sku")
        .doc(realId)
        .update({
          data: {
            stock: _.inc(-item.quantity),
          },
        });

      // 1.5 扣减 SPU 总库存 (可选，Deshan 项目 spuStockQuantity 字段)
      const spuId = skuData.spuId;
      if (spuId) {
        // 需要先查一次 SPu 吗？如果不查直接 update 可能 fail 如果 spuId 不对？
        // 这里假设 spuId 是正确的 _id
        await transaction
          .collection("goods_spu")
          .doc(spuId)
          .update({
            data: {
              spuStockQuantity: _.inc(-item.quantity),
            },
          });
      }
    }

    const normalizedDeliveryType = Number(orderData.deliveryType) === 2 ? 2 : 1;
    const totalGoodsCount = goodsList.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
    const computedOrderSummary = {
      ...buildOrderSummary({
        goodsTotalAmount,
        deliveryType: normalizedDeliveryType,
      }),
      totalGoodsCount,
    };
    const ts = Date.now();
    const finalOrderData = {
      goodsList,
      ...orderData,
      orderSummary: computedOrderSummary,
      deliveryType: normalizedDeliveryType,
      _openid: openId, // 确保 openid 正确
      status: "PENDING_PAYMENT",
      createdAt: ts,
      updatedAt: ts,
      deleted: false, // 集合方式添加数据不会添加默认值
    };
    if (distributorOpenid) {
      finalOrderData.distributorOpenid = distributorOpenid;
      finalOrderData.distributorNickName = distributorNickName;
    }

    // 2. 创建订单
    console.log("[createOrder] creating order:", finalOrderData);
    const orderRes = await transaction.collection("order").add({
      data: finalOrderData,
    });
    console.log("[createOrder] order created:", orderRes);

    // 2.1 生成订单号 (时间戳 + _id后6位)
    const createdId = orderRes?._id;
    const orderNo = `${Date.now()}${createdId ? createdId.slice(-6) : ""}`;
    if (createdId) {
      await transaction
        .collection("order")
        .doc(createdId)
        .update({
          data: { orderNo, updatedAt: Date.now() },
        });
    }

    // 3. (可选) 清理购物车
    const cartIds = goodsList
      .filter((g) => g.cartId) // 前端传递的 item.cartId (原 _id)
      .map((g) => g.cartId);

    if (cartIds.length > 0) {
      console.log("[createOrder] removing cart items:", cartIds);
      await transaction
        .collection("cart")
        .where({
          _id: _.in(cartIds),
          _openid: openId, // 双重保障，只能删自己的
        })
        .remove();
    }

    // 4. 提交事务
    console.log("[createOrder] committing transaction");
    await transaction.commit();

    return {
      success: true,
      orderId: orderRes._id,
      orderNo: orderNo,
    };
  } catch (err) {
    console.error("[createOrder] transaction error:", err);
    await transaction.rollback();
    return {
      success: false,
      message: err.message || "创建订单失败",
    };
  }
};
