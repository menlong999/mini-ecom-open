const cloud = require("wx-server-sdk");
const { init } = require("./wxCloudClientSDK.umd.js");
const crypto = require("crypto");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 初始化数据模型 SDK
// 这会挂载 models 到 cloud 对象上，使得我们可以使用 cloud.models.order
init(cloud);

// 对应 OrderStatus.PENDING_DELIVERY (待发货)
const STATUS_PENDING_DELIVERY = "PENDING_DELIVERY";
// 对应 OrderStatus.PENDING_RECEIPT (待收货)
const STATUS_PENDING_RECEIPT = "PENDING_RECEIPT";

function normalizeWxpayResource(resource) {
  if (!resource) return null;
  if (typeof resource === "string") {
    try {
      return JSON.parse(resource);
    } catch (err) {
      // If it's a plain ciphertext string, return as-is to trigger validation error.
      return { ciphertext: resource };
    }
  }
  return resource;
}

function decryptWxpayResource(resource, apiV3Key) {
  const normalized = normalizeWxpayResource(resource);
  const {
    ciphertext,
    nonce,
    associated_data: associatedData,
  } = normalized || {};
  if (!ciphertext || !nonce || !apiV3Key) {
    throw new Error("Missing ciphertext/nonce/associated_data or apiV3Key");
  }

  const buf = Buffer.from(ciphertext, "base64");
  const authTag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);

  const decipher = crypto.createDecipheriv("aes-256-gcm", apiV3Key, nonce);
  if (associatedData) {
    decipher.setAAD(Buffer.from(associatedData));
  }
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
}

exports.main = async (event, context) => {
  console.log("[paymentCallback] event:", event);

  let returnCode;
  let resultCode;
  let outTradeNo;
  let transactionId;
  let timeEnd;
  let totalFee;
  let cashFee;

  // 工作流 wxpayTrigger 回调：从 input.data 中获取 resource 解密
  if (
    event &&
    event.wxpayTrigger &&
    event.wxpayTrigger.input &&
    event.wxpayTrigger.input.data
  ) {
    try {
      const input = event.wxpayTrigger.input || {};
      const payload = JSON.parse(input.data);
      const plaintext = decryptWxpayResource(
        payload && payload.resource,
        input.apiV3key
      );
      const decrypted = JSON.parse(plaintext);

      outTradeNo = decrypted.out_trade_no;
      transactionId = decrypted.transaction_id;
      timeEnd = decrypted.success_time || decrypted.time_end;
      totalFee = decrypted.amount ? decrypted.amount.total : undefined;
      cashFee = decrypted.amount ? decrypted.amount.payer_total : undefined;
      returnCode = "SUCCESS";
      resultCode =
        payload && payload.event_type === "TRANSACTION.SUCCESS"
          ? "SUCCESS"
          : "FAIL";

      console.log("[paymentCallback] decrypted wxpay payload:", {
        outTradeNo,
        transactionId,
        timeEnd,
        totalFee,
        cashFee,
        eventType: payload ? payload.event_type : undefined,
      });
    } catch (err) {
      console.error("[paymentCallback] decrypt wxpay resource failed:", err);
      return { errcode: 1, errmsg: "DECRYPT_FAILED" };
    }
  } else {
    ({
      returnCode,
      resultCode,
      outTradeNo,
      transactionId,
      timeEnd,
      totalFee,
      cashFee,
    } = event);
  }

  if (returnCode !== "SUCCESS" || resultCode !== "SUCCESS") {
    console.warn("[paymentCallback] non-success return/result:", {
      returnCode,
      resultCode,
      outTradeNo,
      transactionId,
    });
    return { errcode: 0, errmsg: "IGNORE_FAILURE" };
  }

  if (!outTradeNo) {
    console.warn("[paymentCallback] missing outTradeNo:", event);
    return { errcode: 1, errmsg: "MISSING_OUT_TRADE_NO" };
  }

  try {
    console.log("[paymentCallback] fetching order:", outTradeNo);
    // 1. 使用 cloud.models 查询订单
    // 参考 orderConfirm.js 的查询风格 (使用 filter 和 where)
    const orderRes = await cloud.models.order.get({
      filter: {
        where: {
          $and: [
            {
              _id: { $eq: outTradeNo },
            },
          ],
        },
      },
    });

    const order = orderRes.data;

    if (!order) {
      console.error("[paymentCallback] order not found:", outTradeNo, orderRes);
      // 如果查询不到订单，可能是延迟或异常，返回错误让微信重试
      return { errcode: 1, errmsg: "ORDER_NOT_FOUND" };
    }

    const nextStatus = STATUS_PENDING_DELIVERY;

    if (order.status === nextStatus) {
      console.log("[paymentCallback] already processed:", outTradeNo);
      return { errcode: 0, errmsg: "SUCCESS" };
    }

    // 2. 使用 cloud.models 更新订单
    // 注意：微搭数据模型 API 通常接收 JSON 数据，时间类型建议使用时间戳
    console.log("[paymentCallback] updating order:", outTradeNo);
    const updateData = {
      status: nextStatus,
      payTime: Date.now(), // 使用时间戳代替 db.serverDate()
      wechatPayInfo: {
        transactionId,
        timeEnd,
        totalFee,
        cashFee,
      },
    };

    const updateRes = await cloud.models.order.update({
      filter: {
        where: {
          $and: [
            {
              _id: { $eq: outTradeNo },
            },
          ],
        },
      },
      data: updateData,
    });

    console.log("[paymentCallback] order update success:", updateRes);

    return { errcode: 0, errmsg: "SUCCESS" };
  } catch (err) {
    console.error("[paymentCallback] handler error:", err);
    return { errcode: 1, errmsg: err.message || "INTERNAL_ERROR" };
  }
};
