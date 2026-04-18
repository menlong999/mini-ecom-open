const cloud = require("wx-server-sdk");
const { init } = require("./wxCloudClientSDK.umd.js");
const crypto = require("crypto");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

init(cloud);

const db = cloud.database();
const _ = db.command;

const AFTER_SERVICE_COLLECTION = "after-service";
const ORDER_COLLECTION = "order";

const AfterServiceStatus = {
  TO_AUDIT: 10,
  THE_APPROVED: 20,
  HAVE_THE_GOODS: 30,
  ABNORMAL_RECEIVING: 40,
  COMPLETE: 50,
  CLOSED: 60,
  REFUND_ABNORMAL: 70,
};

const RefundStatus = {
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  ABNORMAL: "ABNORMAL",
  CLOSED: "CLOSED",
};

function normalizeWxpayResource(resource) {
  if (!resource) return null;
  if (typeof resource === "string") {
    try {
      return JSON.parse(resource);
    } catch (err) {
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

function parseRefundTime(timeString) {
  if (!timeString) return 0;
  const ms = Date.parse(timeString);
  return Number.isNaN(ms) ? 0 : ms;
}

async function getAfterServiceByRefundNo(outRefundNo) {
  if (!outRefundNo) return null;
  const res = await db
    .collection(AFTER_SERVICE_COLLECTION)
    .where({ "refund.outRefundNo": outRefundNo })
    .limit(1)
    .get();
  return res.data && res.data.length ? res.data[0] : null;
}

async function getAfterServiceByOrderId(orderId) {
  if (!orderId) return null;
  const res = await db
    .collection(AFTER_SERVICE_COLLECTION)
    .where({ orderId })
    .limit(1)
    .get();
  return res.data && res.data.length ? res.data[0] : null;
}

async function updateOrderGoodsStatus(service, status) {
  const orderId = service.orderId;
  if (!orderId) return;

  const orderRes = await db.collection(ORDER_COLLECTION).doc(orderId).get();
  const order = orderRes.data;
  if (!order || !order.goodsList || !order.goodsList.length) return;

  const rawGoodsList = Array.isArray(service.goods)
    ? service.goods
    : service.goods
    ? [service.goods]
    : [];
  if (!rawGoodsList.length) return;

  const updateData = {};
  rawGoodsList.forEach((goods) => {
    const index = order.goodsList.findIndex(
      (item) => item.skuId === goods.skuId
    );
    if (index < 0) return;
    updateData[`goodsList.${index}.afterServiceStatus`] = status;
    updateData[`goodsList.${index}.afterServiceId`] = service._id;
    updateData[`goodsList.${index}.rightsNo`] = service.rightsNo;
  });

  if (Object.keys(updateData).length) {
    await db
      .collection(ORDER_COLLECTION)
      .doc(orderId)
      .update({ data: updateData });
  }
}

exports.main = async (event, context) => {
  console.log("[refundCallback] event:", event);

  let eventType;
  let outRefundNo;
  let outTradeNo;
  let refundId;
  let transactionId;
  let refundStatus;
  let successTime;
  let amount;

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

      eventType = payload && payload.event_type;
      outRefundNo = decrypted.out_refund_no;
      outTradeNo = decrypted.out_trade_no;
      refundId = decrypted.refund_id;
      transactionId = decrypted.transaction_id;
      refundStatus = decrypted.refund_status;
      successTime = decrypted.success_time;
      amount = decrypted.amount || {};

      console.log("[refundCallback] decrypted wxpay payload:", {
        eventType,
        outRefundNo,
        outTradeNo,
        refundId,
        transactionId,
        refundStatus,
        successTime,
        amount,
      });
    } catch (err) {
      console.error("[refundCallback] decrypt wxpay resource failed:", err);
      return { errcode: 1, errmsg: "DECRYPT_FAILED" };
    }
  } else {
    ({
      eventType,
      outRefundNo,
      outTradeNo,
      refundId,
      transactionId,
      refundStatus,
      successTime,
      amount,
    } = event || {});
    console.log("[refundCallback] non-wxpayTrigger payload:", {
      eventType,
      outRefundNo,
      outTradeNo,
      refundId,
      transactionId,
      refundStatus,
      successTime,
      amount,
    });
  }

  if (!outRefundNo && !outTradeNo) {
    console.warn("[refundCallback] missing outRefundNo/outTradeNo:", event);
    return { errcode: 1, errmsg: "MISSING_OUT_REFUND_NO" };
  }

  const normalizedEventType = eventType || "";
  let finalStatus = RefundStatus.PROCESSING;
  if (
    normalizedEventType.includes("REFUND.SUCCESS") ||
    refundStatus === "SUCCESS"
  ) {
    finalStatus = RefundStatus.SUCCESS;
  } else if (
    normalizedEventType.includes("REFUND.ABNORMAL") ||
    refundStatus === "ABNORMAL"
  ) {
    finalStatus = RefundStatus.ABNORMAL;
  } else if (
    normalizedEventType.includes("REFUND.CLOSED") ||
    refundStatus === "CLOSED"
  ) {
    finalStatus = RefundStatus.CLOSED;
  }

  if (finalStatus === RefundStatus.PROCESSING) {
    console.warn("[refundCallback] unknown refund status, ignore:", {
      eventType: normalizedEventType,
      refundStatus,
      outRefundNo,
      outTradeNo,
    });
    return { errcode: 0, errmsg: "IGNORE_UNKNOWN_STATUS" };
  }

  try {
    let service = await getAfterServiceByRefundNo(outRefundNo);
    if (!service && outTradeNo) {
      service = await getAfterServiceByOrderId(outTradeNo);
    }

    if (!service) {
      console.error("[refundCallback] after-service not found:", {
        outRefundNo,
        outTradeNo,
      });
      return { errcode: 1, errmsg: "AFTER_SERVICE_NOT_FOUND" };
    }

    console.log("[refundCallback] service matched:", {
      rightsNo: service.rightsNo,
      status: service.status,
      refundStatus: service.refund && service.refund.status,
    });

    if (
      finalStatus === RefundStatus.SUCCESS &&
      service.status === AfterServiceStatus.COMPLETE &&
      service.refund &&
      service.refund.status === RefundStatus.SUCCESS
    ) {
      console.log("[refundCallback] already processed:", service.rightsNo);
      return { errcode: 0, errmsg: "SUCCESS" };
    }

    const now = Date.now();
    const refundAmountCents = Number(amount && amount.refund);
    const refundAmount = Number.isFinite(refundAmountCents)
      ? Math.round(refundAmountCents) / 100
      : undefined;
    const totalAmountCents = Number(amount && amount.total);
    const totalAmount = Number.isFinite(totalAmountCents)
      ? Math.round(totalAmountCents) / 100
      : undefined;

    const nextRefund = {
      ...(service.refund || {}),
      status: finalStatus,
      outRefundNo:
        outRefundNo || (service.refund && service.refund.outRefundNo),
      refundId: refundId || (service.refund && service.refund.refundId) || "",
      transactionId:
        transactionId || (service.refund && service.refund.transactionId) || "",
      amount: Number.isFinite(refundAmount) ? refundAmount : service.amount,
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : undefined,
    };

    if (finalStatus === RefundStatus.SUCCESS) {
      nextRefund.time = parseRefundTime(successTime) || now;
      if (!nextRefund.traceNo && refundId) {
        nextRefund.traceNo = refundId;
      }
    } else {
      nextRefund.errorReason = refundStatus || normalizedEventType || "UNKNOWN";
    }

    const historyRemarkMap = {
      [RefundStatus.SUCCESS]: `退款成功，金额: ${nextRefund.amount || 0}`,
      [RefundStatus.ABNORMAL]: "退款异常，请联系客服处理",
      [RefundStatus.CLOSED]: "退款已关闭，请联系客服处理",
      [RefundStatus.PROCESSING]: "退款处理中",
    };

    const nextStatus =
      finalStatus === RefundStatus.SUCCESS
        ? AfterServiceStatus.COMPLETE
        : AfterServiceStatus.REFUND_ABNORMAL;

    const updateData = {
      status: nextStatus,
      refund: nextRefund,
      updatedAt: now,
      history: _.push({
        status: nextStatus,
        time: now,
        operator: "SYSTEM",
        remark: historyRemarkMap[finalStatus] || "退款状态更新",
      }),
    };

    console.log("[refundCallback] update data:", {
      rightsNo: service.rightsNo,
      nextStatus,
      refundStatus: finalStatus,
      amount: nextRefund.amount,
    });

    await db
      .collection(AFTER_SERVICE_COLLECTION)
      .doc(service._id)
      .update({ data: updateData });
    await updateOrderGoodsStatus(service, nextStatus);

    console.log("[refundCallback] update success:", {
      rightsNo: service.rightsNo,
      nextStatus,
    });
    return { errcode: 0, errmsg: "SUCCESS" };
  } catch (err) {
    console.error("[refundCallback] handler error:", err);
    return { errcode: 1, errmsg: err.message || "INTERNAL_ERROR" };
  }
};
