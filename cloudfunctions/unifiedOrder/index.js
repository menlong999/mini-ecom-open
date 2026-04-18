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

const workflowName =
  (privateConfig.payment && privateConfig.payment.workflowName) || "";

function toCents(amountYuan) {
  const amount = Number(amountYuan);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid order total amount");
  }
  return Math.round(amount * 100);
}

function getOrderTotalFee(order) {
  return toCents(
    order && order.orderSummary && order.orderSummary.totalPayAmount
  );
}

function getPaymentDescription(order) {
  const goodsList = Array.isArray(order && order.goodsList)
    ? order.goodsList
    : [];
  const firstTitle =
    goodsList[0] && goodsList[0].title
      ? String(goodsList[0].title)
      : "商品订单";
  const orderNo = order && order.orderNo ? String(order.orderNo) : "";
  return orderNo ? `${firstTitle} ${orderNo}` : firstTitle;
}

exports.main = async (event, context) => {
  console.log("[unifiedOrder] event:", event);
  const { orderId, payerOpenId, totalFee: clientTotalFee } = event || {};

  // 1. 简单校验
  if (!orderId) {
    console.warn("[unifiedOrder] missing params:", { orderId });
    return {
      code: -1,
      message: "缺少订单ID参数",
    };
  }

  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  // [New] 2. 安全校验：确保订单存在且属于当前用户
  const db = cloud.database();
  const orderRes = await db
    .collection("order")
    .where({
      _id: orderId,
      _openid: openId,
      status: "PENDING_PAYMENT", // 只能支付待支付的订单
    })
    .get();

  if (!orderRes.data || orderRes.data.length === 0) {
    console.warn("[unifiedOrder] order not found or permission denied:", {
      orderId,
      openId,
    });
    return {
      code: -1,
      message: "订单不存在或无法支付",
    };
  }

  const order = orderRes.data[0];
  let totalFee;
  try {
    totalFee = getOrderTotalFee(order);
  } catch (error) {
    console.warn("[unifiedOrder] invalid order amount:", {
      orderId,
      orderSummary: order && order.orderSummary,
      message: error.message,
    });
    return {
      code: -1,
      message: "订单金额异常",
    };
  }

  if (
    Number.isFinite(Number(clientTotalFee)) &&
    Number(clientTotalFee) !== totalFee
  ) {
    console.warn("[unifiedOrder] ignore mismatched client totalFee:", {
      orderId,
      clientTotalFee,
      serverTotalFee: totalFee,
    });
  }

  console.log("[unifiedOrder] calling payment workflow:", wxContext.OPENID);

  if (!workflowName) {
    return {
      code: -1,
      message: "支付工作流未配置",
    };
  }

  const res = await cloud.callFunction({
    // 固定参数
    name: "cloudbase_module",
    data: {
      // 工作流ID
      name: workflowName,
      data: {
        /**
         * 注：appid 和 mchid 工作流已自动注入，无需传递
         * 本示例只传递了必要的参数，其他详细参数可参考微信支付文档：
         * https://pay.weixin.qq.com/doc/v3/merchant/4012791897
         */
        description: getPaymentDescription(order),
        amount: {
          total: totalFee, // 订单金额
          currency: "CNY",
        },
        // 商户订单号，业务自行生成，此处仅为示例
        out_trade_no: orderId,
        payer: {
          // 服务端调用需要手动传入payer.openid参数，可从云开发上下文中直接获取
          openid: payerOpenId || "",
        },
      },
    },
  });

  console.log("[unifiedOrder] payment workflow result:", res);
  return res.result;
};
