const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const AfterServiceStatus = {
  TO_AUDIT: 10,
  CLOSED: 60,
};

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload = {} } = event || {};

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  try {
    switch (action) {
      case "apply":
        return await applyService(openId, payload);
      case "cancel":
        return await cancelService(openId, payload);
      case "updateLogistics":
        return await updateServiceLogistics(openId, payload);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[manageAfterService] error:", err);
    return { success: false, message: err.message || "Internal error" };
  }
};

async function applyService(openId, payload) {
  const {
    orderId,
    goodsList,
    amount,
    type,
    reason,
    reasonType,
    desc,
    images,
    logistics,
    logisticsStatus,
  } = payload || {};

  const finalImages = images || [];

  if (!orderId || !Array.isArray(goodsList) || goodsList.length === 0) {
    throw new Error("Missing orderId or goodsList");
  }

  const orderRes = await db.collection("order").doc(orderId).get();
  const order = orderRes.data;

  if (!order) {
    throw new Error("Order not found");
  }

  if (order._openid !== openId) {
    throw new Error("Permission denied");
  }

  const existingServiceCount = await db
    .collection("after-service")
    .where({
      orderId,
      _openid: openId,
    })
    .count();

  if (existingServiceCount.total > 0) {
    throw new Error("该订单已存在售后单，请勿重复申请");
  }

  const orderGoodsList = Array.isArray(order.goodsList) ? order.goodsList : [];
  if (!orderGoodsList.length) {
    throw new Error("Goods not found in order");
  }

  const selectionMap = {};
  goodsList.forEach((item) => {
    if (!item || !item.skuId) return;
    const qty = Number(item.refundQuantity || item.quantity || 0);
    if (qty <= 0) return;
    selectionMap[item.skuId] = (selectionMap[item.skuId] || 0) + qty;
  });

  const selectedSkuIds = Object.keys(selectionMap);
  if (!selectedSkuIds.length) {
    throw new Error("No valid goods selected");
  }

  const selectedGoods = [];
  let maxRefundAmount = 0;
  let totalRefundQuantity = 0;

  for (const skuId of selectedSkuIds) {
    const goods = orderGoodsList.find((g) => g.skuId === skuId);
    if (!goods) {
      throw new Error("Goods not found in order");
    }
    const refundQuantity = Math.min(selectionMap[skuId], goods.quantity);
    if (refundQuantity <= 0) continue;

    selectedGoods.push({
      skuId: goods.skuId,
      spuId: goods.spuId,
      title: goods.title,
      thumb: goods.thumb,
      price: goods.price,
      specs: goods.specs || [],
      specInfo: goods.specInfo || [],
      quantity: goods.quantity,
      refundQuantity,
    });

    totalRefundQuantity += refundQuantity;
    maxRefundAmount += (Number(goods.price) || 0) * refundQuantity;
  }

  if (!selectedGoods.length) {
    throw new Error("No valid goods selected");
  }

  const finalAmount = Number(amount);
  if (!finalAmount || Number.isNaN(finalAmount) || finalAmount <= 0) {
    throw new Error("Invalid refund amount");
  }
  if (finalAmount > maxRefundAmount) {
    throw new Error("Refund amount exceeds maximum");
  }

  const rightsNo = `R${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const now = Date.now();
  const afterServiceData = {
    _openid: openId,
    rightsNo,
    orderId: order._id,
    orderNo: order.orderNo,
    goods: selectedGoods,
    type,
    status: AfterServiceStatus.TO_AUDIT,
    reason,
    reasonType,
    desc,
    applyAmount: finalAmount,
    amount: finalAmount,
    quantity: totalRefundQuantity,
    images: finalImages,
    logistics: logistics || {},
    logisticsStatus: logisticsStatus || null,
    audit: {},
    refund: {},
    history: [
      {
        status: AfterServiceStatus.TO_AUDIT,
        time: now,
        operator: "USER",
        remark: "用户提交申请",
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const addRes = await db.collection("after-service").add({
    data: afterServiceData,
  });

  const updateData = {};
  selectedGoods.forEach((item) => {
    const index = orderGoodsList.findIndex((g) => g.skuId === item.skuId);
    if (index < 0) return;
    updateData[`goodsList.${index}.afterServiceStatus`] =
      AfterServiceStatus.TO_AUDIT;
    updateData[`goodsList.${index}.afterServiceId`] = addRes._id;
    updateData[`goodsList.${index}.rightsNo`] = rightsNo;
  });

  if (Object.keys(updateData).length) {
    await db.collection("order").doc(orderId).update({ data: updateData });
  }

  return {
    success: true,
    data: {
      rightsNo,
      id: addRes._id,
    },
  };
}

async function cancelService(openId, payload) {
  const { rightsNo } = payload || {};

  if (!rightsNo) {
    throw new Error("Missing rightsNo");
  }

  const res = await db
    .collection("after-service")
    .where({
      rightsNo,
      _openid: openId,
    })
    .get();

  if (res.data.length === 0) {
    throw new Error("After service order not found");
  }

  const serviceOrder = res.data[0];
  if (serviceOrder.status !== AfterServiceStatus.TO_AUDIT) {
    throw new Error("Current status cannot be revoked");
  }

  const now = Date.now();
  await db
    .collection("after-service")
    .doc(serviceOrder._id)
    .update({
      data: {
        status: AfterServiceStatus.CLOSED,
        updatedAt: now,
        history: _.push({
          status: AfterServiceStatus.CLOSED,
          time: now,
          operator: "USER",
          remark: "用户撤销申请",
        }),
      },
    });

  if (serviceOrder.orderId) {
    const orderRes = await db
      .collection("order")
      .doc(serviceOrder.orderId)
      .get();
    const order = orderRes.data;
    if (order && Array.isArray(order.goodsList)) {
      const rawGoodsList = Array.isArray(serviceOrder.goods)
        ? serviceOrder.goods
        : serviceOrder.goods
        ? [serviceOrder.goods]
        : [];
      const updateData = {};
      rawGoodsList.forEach((goods) => {
        const index = order.goodsList.findIndex(
          (item) => item.skuId === goods.skuId
        );
        if (index < 0) return;
        updateData[`goodsList.${index}.afterServiceStatus`] =
          AfterServiceStatus.CLOSED;
        updateData[`goodsList.${index}.afterServiceId`] = serviceOrder._id;
        updateData[`goodsList.${index}.rightsNo`] = serviceOrder.rightsNo;
      });
      if (Object.keys(updateData).length) {
        await db
          .collection("order")
          .doc(serviceOrder.orderId)
          .update({ data: updateData });
      }
    }
  }

  return { success: true };
}

async function updateServiceLogistics(openId, payload) {
  const {
    rightsNo,
    logisticsCompanyCode,
    logisticsCompanyName,
    logisticsNo,
    remark,
  } = payload || {};

  if (!rightsNo) {
    throw new Error("Missing rightsNo");
  }
  if (!logisticsNo) {
    throw new Error("Missing logisticsNo");
  }

  const res = await db
    .collection("after-service")
    .where({
      rightsNo,
      _openid: openId,
    })
    .get();

  if (res.data.length === 0) {
    throw new Error("After service order not found");
  }

  const serviceOrder = res.data[0];
  const now = Date.now();
  await db
    .collection("after-service")
    .doc(serviceOrder._id)
    .update({
      data: {
        logistics: {
          logisticsNo,
          companyCode: logisticsCompanyCode,
          companyName: logisticsCompanyName,
          remark: remark || "",
          updatedAt: now,
        },
        updatedAt: now,
      },
    });

  return { success: true };
}
