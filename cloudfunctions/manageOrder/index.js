const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION = "order";
const AFTER_SERVICE_COLLECTION = "after-service";

// Order Status Constants (Sync with orderConfig.js ideally, but hardcoded for now or common lib)
const OrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING_DELIVERY: "PENDING_DELIVERY",
  PENDING_RECEIPT: "PENDING_RECEIPT",
  CANCELED_NOT_PAYMENT: "CANCELED_NOT_PAYMENT",
  CANCELED_PAYMENT: "CANCELED_PAYMENT",
  PAYMENT_TIMEOUT: "PAYMENT_TIMEOUT",
  COMPLETE: "COMPLETE",
};

const AfterServiceInProgress = [10, 20, 30, 40];

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload } = event;

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  try {
    switch (action) {
      case "cancel":
        return await cancelOrder(openId, payload);
      case "delete":
        return await deleteOrder(openId, payload);
      case "confirmReceipt":
        return await confirmReceipt(openId, payload);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[manageOrder] error:", err);
    return { success: false, message: err.message };
  }
};

async function cancelOrder(
  openId,
  { orderId, cancelReason, cancelReasonDesc, currentStatus }
) {
  let newStatus = OrderStatus.PAYMENT_TIMEOUT;
  if (currentStatus === OrderStatus.PENDING_PAYMENT) {
    newStatus = OrderStatus.CANCELED_NOT_PAYMENT;
  } else if (currentStatus === OrderStatus.PENDING_DELIVERY) {
    newStatus = OrderStatus.CANCELED_PAYMENT;
  }

  // Update with condition: must be own order
  const res = await db
    .collection(COLLECTION)
    .where({
      _id: orderId,
      _openid: openId,
    })
    .update({
      data: {
        status: newStatus,
        cancelReason: cancelReason || "",
        cancelReasonDesc: cancelReasonDesc || "",
        cancelTime: Date.now(),
        updatedAt: Date.now(),
      },
    });

  if (res.stats.updated === 0) {
    return { success: false, message: "Order not found or update failed" };
  }
  return { success: true };
}

async function deleteOrder(openId, { orderId }) {
  const res = await db
    .collection(COLLECTION)
    .where({
      _id: orderId,
      _openid: openId,
    })
    .update({
      data: {
        deleted: true,
        deleteTime: Date.now(),
        updatedAt: Date.now(),
      },
    });

  if (res.stats.updated === 0) {
    return { success: false, message: "Order not found or update failed" };
  }
  return { success: true };
}

async function confirmReceipt(openId, { orderId }) {
  if (!orderId) {
    return { success: false, message: "OrderId required" };
  }

  const serviceCount = await db
    .collection(AFTER_SERVICE_COLLECTION)
    .where({
      orderId: orderId,
      _openid: openId,
      status: _.in(AfterServiceInProgress),
    })
    .count();
  if (serviceCount.total > 0) {
    return { success: false, message: "After service in progress" };
  }

  const res = await db
    .collection(COLLECTION)
    .where({
      _id: orderId,
      _openid: openId,
      status: OrderStatus.PENDING_RECEIPT,
    })
    .update({
      data: {
        status: OrderStatus.COMPLETE,
        receiptTime: Date.now(), // Number type usually
        updatedAt: Date.now(),
      },
    });

  if (res.stats.updated === 0) {
    return { success: false, message: "Order status not allowed" };
  }
  return { success: true };
}
