const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const ORDER_COLLECTION = "order";
const USER_COLLECTION = "user_info";

const OrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING_DELIVERY: "PENDING_DELIVERY",
  PENDING_RECEIPT: "PENDING_RECEIPT",
  COMPLETE: "COMPLETE",
};

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload = {} } = event || {};

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  const adminInfo = await getAdminInfo(openId);
  if (!adminInfo) {
    return { success: false, message: "Permission denied" };
  }

  try {
    switch (action) {
      case "list":
        return await listOrders(payload);
      case "detail":
        return await getOrderDetail(payload);
      case "ship":
        return await shipOrder(payload, adminInfo);
      case "confirmPickup":
        return await confirmPickup(payload, adminInfo);
      case "updateLogistics":
        return await updateLogistics(payload, adminInfo);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageOrder] error:", err);
    return { success: false, message: err.message || "Internal error" };
  }
};

async function getAdminInfo(openId) {
  const res = await db
    .collection(USER_COLLECTION)
    .where({ _openid: openId })
    .limit(1)
    .get();
  if (!res.data || res.data.length === 0) return null;
  const user = res.data[0];
  if (user.role !== "admin") return null;
  return {
    openId,
    nickName: user.nickName || "管理员",
  };
}

async function listOrders({
  page = 1,
  pageSize = 20,
  status = "ALL",
  keyword = "",
}) {
  const skip = (page - 1) * pageSize;

  const where = {
    deleted: _.neq(true),
  };

  if (status && status !== "ALL") {
    where.status = status;
  } else {
    where.status = _.in([
      OrderStatus.PENDING_DELIVERY,
      OrderStatus.PENDING_RECEIPT,
    ]);
  }

  if (keyword && keyword.trim()) {
    where.orderNo = db.RegExp({
      regexp: keyword,
      options: "i",
    });
  }

  const countRes = await db.collection(ORDER_COLLECTION).where(where).count();
  const total = countRes.total || 0;

  const listRes = await db
    .collection(ORDER_COLLECTION)
    .where(where)
    .orderBy("createdAt", "desc")
    .skip(skip)
    .limit(pageSize)
    .get();

  const list = (listRes.data || []).map((order) => ({
    _id: order._id,
    orderNo: order.orderNo || "",
    status: order.status,
    deliveryType: order.deliveryType,
    createdAt: order.createdAt,
    orderSummary: order.orderSummary || {},
    goodsList: order.goodsList || [],
    userAddress: order.userAddress || null,
    pickupStore: order.pickupStore || null,
    logistics: order.logistics || {},
    shippedTime: order.shippedTime || null,
  }));

  return {
    success: true,
    data: {
      list,
      total,
      page,
      pageSize,
    },
  };
}

async function getOrderDetail({ orderId }) {
  if (!orderId) throw new Error("OrderId required");
  const res = await db.collection(ORDER_COLLECTION).doc(orderId).get();
  const order = res.data;
  if (!order) throw new Error("Order not found");
  return { success: true, data: order };
}

async function shipOrder(
  { orderId, logisticsNo, companyCode, companyName, remark },
  adminInfo
) {
  if (!orderId) throw new Error("OrderId required");
  if (!logisticsNo || !companyCode || !companyName)
    throw new Error("Missing logistics info");

  const orderRes = await db.collection(ORDER_COLLECTION).doc(orderId).get();
  const order = orderRes.data;
  if (!order) throw new Error("Order not found");

  if (Number(order.deliveryType) === 2) {
    throw new Error("自提订单无需发货");
  }

  if (order.status !== OrderStatus.PENDING_DELIVERY) {
    throw new Error("订单状态不允许发货");
  }

  const now = Date.now();
  const logistics = {
    logisticsNo,
    companyCode,
    companyName,
    remark: remark || "",
    operator: adminInfo.nickName,
    openid: adminInfo.openId,
    updatedAt: now,
  };

  const updateRes = await db
    .collection(ORDER_COLLECTION)
    .doc(orderId)
    .update({
      data: {
        status: OrderStatus.PENDING_RECEIPT,
        logistics,
        shippedTime: now,
        updatedAt: now,
      },
    });

  if (updateRes.stats && updateRes.stats.updated === 0) {
    throw new Error("Update failed");
  }
  return { success: true };
}

async function confirmPickup({ orderId, remark }, adminInfo) {
  if (!orderId) throw new Error("OrderId required");

  const orderRes = await db.collection(ORDER_COLLECTION).doc(orderId).get();
  const order = orderRes.data;
  if (!order) throw new Error("Order not found");

  if (Number(order.deliveryType) !== 2) {
    throw new Error("非自提订单无法确认提货");
  }

  if (order.status !== OrderStatus.PENDING_DELIVERY) {
    throw new Error("订单状态不允许确认提货");
  }

  const now = Date.now();
  const logistics = {
    logisticsNo: "",
    companyCode: "",
    companyName: "",
    remark: remark || "",
    operator: adminInfo.nickName,
    openid: adminInfo.openId,
    updatedAt: now,
  };

  const updateRes = await db
    .collection(ORDER_COLLECTION)
    .doc(orderId)
    .update({
      data: {
        status: OrderStatus.PENDING_RECEIPT,
        logistics,
        shippedTime: now,
        updatedAt: now,
      },
    });

  if (updateRes.stats && updateRes.stats.updated === 0) {
    throw new Error("Update failed");
  }
  return { success: true };
}

async function updateLogistics(
  { orderId, logisticsNo, companyCode, companyName, remark },
  adminInfo
) {
  if (!orderId) throw new Error("OrderId required");
  if (!logisticsNo || !companyCode || !companyName)
    throw new Error("Missing logistics info");

  const orderRes = await db.collection(ORDER_COLLECTION).doc(orderId).get();
  const order = orderRes.data;
  if (!order) throw new Error("Order not found");

  if (Number(order.deliveryType) === 2) {
    throw new Error("自提订单无需修改物流");
  }

  if (order.status !== OrderStatus.PENDING_RECEIPT) {
    throw new Error("订单状态不允许修改物流");
  }

  const now = Date.now();
  const logistics = {
    logisticsNo,
    companyCode,
    companyName,
    remark: remark || "",
    operator: adminInfo.nickName,
    openid: adminInfo.openId,
    updatedAt: now,
  };

  const updateRes = await db
    .collection(ORDER_COLLECTION)
    .doc(orderId)
    .update({
      data: {
        logistics,
        updatedAt: now,
      },
    });

  if (updateRes.stats && updateRes.stats.updated === 0) {
    throw new Error("Update failed");
  }
  return { success: true };
}
