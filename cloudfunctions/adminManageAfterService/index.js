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

const SKIP_PAY_AMOUNT_CHECK = process.env.SKIP_PAY_AMOUNT_CHECK === "true";

const db = cloud.database();
const _ = db.command;

const AFTER_SERVICE_COLLECTION = "after-service";
const ORDER_COLLECTION = "order";
const USER_COLLECTION = "user_info";
const REFUND_WORKFLOW_NAME =
  (privateConfig.payment && privateConfig.payment.refundWorkflowName) || "";

const AfterServiceStatus = {
  TO_AUDIT: 10,
  THE_APPROVED: 20,
  HAVE_THE_GOODS: 30,
  ABNORMAL_RECEIVING: 40,
  COMPLETE: 50,
  CLOSED: 60,
  REFUND_ABNORMAL: 70,
};

const ServiceType = {
  RETURN_GOODS: 10,
  ONLY_REFUND: 20,
  ORDER_CANCEL: 30,
};

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload = {} } = event || {};

  console.log("[adminManageAfterService] request:", {
    action,
    openId,
    payloadKeys: Object.keys(payload || {}),
  });

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  const adminInfo = await getAdminInfo(openId);
  if (!adminInfo) {
    console.warn("[adminManageAfterService] permission denied:", {
      openId,
      action,
    });
    return { success: false, message: "Permission denied" };
  }

  try {
    switch (action) {
      case "list":
        console.log("[adminManageAfterService] list start");
        return await listServices(payload);
      case "detail":
        console.log("[adminManageAfterService] detail start:", {
          rightsNo: payload.rightsNo,
          id: payload.id,
        });
        return await getServiceDetail(payload);
      case "approve":
        console.log("[adminManageAfterService] approve start:", {
          rightsNo: payload.rightsNo,
        });
        return await approveService(payload, adminInfo);
      case "reject":
        console.log("[adminManageAfterService] reject start:", {
          rightsNo: payload.rightsNo,
        });
        return await rejectService(payload, adminInfo);
      case "confirmReceive":
        console.log("[adminManageAfterService] confirmReceive start:", {
          rightsNo: payload.rightsNo,
        });
        return await confirmReceive(payload, adminInfo);
      case "markAbnormal":
        console.log("[adminManageAfterService] markAbnormal start:", {
          rightsNo: payload.rightsNo,
        });
        return await markAbnormal(payload, adminInfo);
      case "refund":
        console.log("[adminManageAfterService] refund start:", {
          rightsNo: payload.rightsNo,
        });
        return await refundService(payload, adminInfo);
      case "close":
        console.log("[adminManageAfterService] close start:", {
          rightsNo: payload.rightsNo,
        });
        return await closeService(payload, adminInfo);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageAfterService] error:", err);
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

async function listServices({
  page = 1,
  pageSize = 20,
  status = "ALL",
  keyword = "",
}) {
  const skip = (page - 1) * pageSize;
  const where = {};

  if (status !== undefined && status !== "ALL" && status !== -1) {
    where.status = Number(status);
  }

  if (keyword && keyword.trim()) {
    where.rightsNo = db.RegExp({
      regexp: keyword,
      options: "i",
    });
  }

  const countRes = await db
    .collection(AFTER_SERVICE_COLLECTION)
    .where(where)
    .count();
  const total = countRes.total || 0;

  const listRes = await db
    .collection(AFTER_SERVICE_COLLECTION)
    .where(where)
    .orderBy("createdAt", "desc")
    .skip(skip)
    .limit(pageSize)
    .get();

  return {
    success: true,
    data: {
      list: listRes.data || [],
      total,
      page,
      pageSize,
    },
  };
}

async function getServiceDetail({ rightsNo, id }) {
  if (!rightsNo && !id) throw new Error("Missing rightsNo or id");
  const where = {};
  if (rightsNo) where.rightsNo = rightsNo;
  if (id) where._id = id;

  const res = await db
    .collection(AFTER_SERVICE_COLLECTION)
    .where(where)
    .limit(1)
    .get();
  if (!res.data || res.data.length === 0)
    throw new Error("After service not found");

  return { success: true, data: res.data[0] };
}

async function approveService(
  { rightsNo, remark = "", approvedAmount },
  adminInfo
) {
  const service = await getServiceByRightsNo(rightsNo);
  if (service.status !== AfterServiceStatus.TO_AUDIT) {
    throw new Error("Status not allowed");
  }

  const applyAmount =
    typeof service.applyAmount === "number"
      ? service.applyAmount
      : service.amount;
  const finalApprovedAmount =
    typeof approvedAmount === "number"
      ? approvedAmount
      : typeof service.amount === "number"
      ? service.amount
      : applyAmount;
  if (
    !finalApprovedAmount ||
    Number.isNaN(finalApprovedAmount) ||
    finalApprovedAmount <= 0
  ) {
    throw new Error("Invalid approved amount");
  }
  if (typeof applyAmount === "number" && finalApprovedAmount > applyAmount) {
    throw new Error("Approved amount exceeds apply amount");
  }

  if (service.orderId) {
    const order = await getOrderById(service.orderId);
    const wechatPayInfo = order && order.wechatPayInfo;
    const totalFee = Number(wechatPayInfo && wechatPayInfo.totalFee);
    if (!SKIP_PAY_AMOUNT_CHECK && Number.isFinite(totalFee) && totalFee > 0) {
      const approvedAmountCents = Math.round(finalApprovedAmount * 100);
      if (approvedAmountCents > totalFee) {
        throw new Error("Approved amount exceeds paid total");
      }
    } else if (SKIP_PAY_AMOUNT_CHECK) {
      console.warn("[approveService] skip paid total check", { totalFee });
    }
  }

  const now = Date.now();
  const reasonText = remark || "无";
  const historyRemark = `申请金额: ${
    applyAmount || 0
  }，审核金额: ${finalApprovedAmount}，原因: ${reasonText}`;
  const updateData = {
    status: AfterServiceStatus.THE_APPROVED,
    amount: finalApprovedAmount,
    audit: {
      time: now,
      reply: remark || "同意售后",
      operator: adminInfo.nickName,
      approvedAmount: finalApprovedAmount,
    },
    updatedAt: now,
    history: _.push({
      status: AfterServiceStatus.THE_APPROVED,
      time: now,
      operator: adminInfo.nickName,
      remark: historyRemark,
    }),
  };

  await db
    .collection(AFTER_SERVICE_COLLECTION)
    .doc(service._id)
    .update({ data: updateData });
  await updateOrderGoodsStatus(service, AfterServiceStatus.THE_APPROVED);
  return { success: true };
}

async function rejectService({ rightsNo, remark = "" }, adminInfo) {
  const service = await getServiceByRightsNo(rightsNo);
  if (service.status !== AfterServiceStatus.TO_AUDIT) {
    throw new Error("Status not allowed");
  }

  const now = Date.now();
  const updateData = {
    status: AfterServiceStatus.CLOSED,
    audit: {
      time: now,
      reply: remark || "拒绝售后",
      operator: adminInfo.nickName,
    },
    updatedAt: now,
    history: _.push({
      status: AfterServiceStatus.CLOSED,
      time: now,
      operator: adminInfo.nickName,
      remark: remark || "拒绝售后",
    }),
  };

  await db
    .collection(AFTER_SERVICE_COLLECTION)
    .doc(service._id)
    .update({ data: updateData });
  await updateOrderGoodsStatus(service, AfterServiceStatus.CLOSED);
  return { success: true };
}

async function confirmReceive({ rightsNo, remark = "" }, adminInfo) {
  const service = await getServiceByRightsNo(rightsNo);
  if (service.type !== ServiceType.RETURN_GOODS) {
    throw new Error("Type not allowed");
  }
  if (service.status !== AfterServiceStatus.THE_APPROVED) {
    throw new Error("Status not allowed");
  }
  if (!service.logistics || !service.logistics.logisticsNo) {
    throw new Error("Missing logistics info");
  }

  const now = Date.now();
  const updateData = {
    status: AfterServiceStatus.HAVE_THE_GOODS,
    updatedAt: now,
    history: _.push({
      status: AfterServiceStatus.HAVE_THE_GOODS,
      time: now,
      operator: adminInfo.nickName,
      remark: remark || "确认收货",
    }),
  };

  await db
    .collection(AFTER_SERVICE_COLLECTION)
    .doc(service._id)
    .update({ data: updateData });
  await updateOrderGoodsStatus(service, AfterServiceStatus.HAVE_THE_GOODS);
  return { success: true };
}

async function markAbnormal({ rightsNo, remark = "" }, adminInfo) {
  const service = await getServiceByRightsNo(rightsNo);
  if (service.type !== ServiceType.RETURN_GOODS) {
    throw new Error("Type not allowed");
  }
  if (service.status !== AfterServiceStatus.THE_APPROVED) {
    throw new Error("Status not allowed");
  }

  const now = Date.now();
  const updateData = {
    status: AfterServiceStatus.ABNORMAL_RECEIVING,
    updatedAt: now,
    history: _.push({
      status: AfterServiceStatus.ABNORMAL_RECEIVING,
      time: now,
      operator: adminInfo.nickName,
      remark: remark || "收货异常",
    }),
  };

  await db
    .collection(AFTER_SERVICE_COLLECTION)
    .doc(service._id)
    .update({ data: updateData });
  await updateOrderGoodsStatus(service, AfterServiceStatus.ABNORMAL_RECEIVING);
  return { success: true };
}

async function refundService(
  { rightsNo, amount, traceNo = "", remark = "" },
  adminInfo
) {
  const service = await getServiceByRightsNo(rightsNo);
  const status = Number(service.status);
  const type = Number(service.type);

  console.log("[refundService] start:", { rightsNo, status, type, amount });

  const allowStatuses = [
    AfterServiceStatus.THE_APPROVED,
    AfterServiceStatus.HAVE_THE_GOODS,
    AfterServiceStatus.ABNORMAL_RECEIVING,
    AfterServiceStatus.REFUND_ABNORMAL,
  ];

  if (!allowStatuses.includes(status)) {
    throw new Error("Status not allowed");
  }

  if (
    status === AfterServiceStatus.THE_APPROVED &&
    type === ServiceType.RETURN_GOODS
  ) {
    throw new Error("Return goods must confirm receive first");
  }

  const now = Date.now();
  if (service.refund && service.refund.status === "PROCESSING") {
    throw new Error("Refund is processing");
  }
  const approvedAmount =
    service.audit && typeof service.audit.approvedAmount === "number"
      ? service.audit.approvedAmount
      : typeof service.amount === "number"
      ? service.amount
      : service.applyAmount;
  const refundAmount = typeof amount === "number" ? amount : service.amount;
  if (!refundAmount || Number.isNaN(refundAmount) || refundAmount <= 0) {
    throw new Error("Invalid refund amount");
  }
  if (
    typeof approvedAmount === "number" &&
    refundAmount !== approvedAmount &&
    !remark
  ) {
    throw new Error(
      "Refund amount differs from approved amount, remark required"
    );
  }

  const order = await getOrderById(service.orderId);
  const wechatPayInfo = order && order.wechatPayInfo;
  const transactionId = wechatPayInfo && wechatPayInfo.transactionId;
  if (!transactionId) {
    throw new Error("Missing transactionId");
  }
  const totalFee = Number(wechatPayInfo && wechatPayInfo.totalFee);
  let refundAmountCents = Math.round(refundAmount * 100);
  if (SKIP_PAY_AMOUNT_CHECK) {
    refundAmountCents = 1;
  }
  console.log("[refundService] amount check:", {
    refundAmount,
    refundAmountCents,
    totalFee,
    SKIP_PAY_AMOUNT_CHECK,
  });
  if (!Number.isFinite(totalFee) || totalFee <= 0) {
    if (SKIP_PAY_AMOUNT_CHECK) {
      console.warn("[refundService] skip invalid totalFee check", { totalFee });
    } else {
      throw new Error("Invalid totalFee");
    }
  } else if (!SKIP_PAY_AMOUNT_CHECK && refundAmountCents > totalFee) {
    throw new Error("Refund amount exceeds paid total");
  } else if (
    SKIP_PAY_AMOUNT_CHECK &&
    Number.isFinite(totalFee) &&
    refundAmountCents > totalFee
  ) {
    console.warn("[refundService] skip refund > paid total", {
      refundAmountCents,
      totalFee,
    });
  }

  const outRefundNo = `${service.rightsNo || rightsNo}-${Date.now()}`;
  console.log("[refundService] call workflow:", { outRefundNo, transactionId });
  await callRefundWorkflow({
    transactionId,
    outRefundNo,
    refundAmount: refundAmountCents,
    totalAmount: totalFee,
  });

  const requestAmount = SKIP_PAY_AMOUNT_CHECK ? 0.01 : refundAmount;
  const updateData = {
    amount: requestAmount,
    refund: {
      ...(service.refund || {}),
      amount: requestAmount,
      traceNo: traceNo || (service.refund && service.refund.traceNo) || "",
      status: "PROCESSING",
      requestAmount: requestAmount,
      requestTime: now,
      outRefundNo,
    },
    updatedAt: now,
    history: _.push({
      status: service.status,
      time: now,
      operator: adminInfo.nickName,
      remark: `发起退款，审核金额: ${
        approvedAmount || 0
      }，退款金额: ${requestAmount}，原因: ${remark || "无"}`,
    }),
  };

  await db
    .collection(AFTER_SERVICE_COLLECTION)
    .doc(service._id)
    .update({ data: updateData });
  console.log("[refundService] updated service:", {
    rightsNo,
    outRefundNo,
    requestAmount,
  });
  return { success: true };
}

async function closeService({ rightsNo, remark = "" }, adminInfo) {
  const service = await getServiceByRightsNo(rightsNo);
  if (service.status === AfterServiceStatus.COMPLETE) {
    throw new Error("Status not allowed");
  }

  const now = Date.now();
  const updateData = {
    status: AfterServiceStatus.CLOSED,
    updatedAt: now,
    history: _.push({
      status: AfterServiceStatus.CLOSED,
      time: now,
      operator: adminInfo.nickName,
      remark: remark || "关闭售后",
    }),
  };

  await db
    .collection(AFTER_SERVICE_COLLECTION)
    .doc(service._id)
    .update({ data: updateData });
  await updateOrderGoodsStatus(service, AfterServiceStatus.CLOSED);
  return { success: true };
}

async function getServiceByRightsNo(rightsNo) {
  if (!rightsNo) throw new Error("RightsNo required");
  const res = await db
    .collection(AFTER_SERVICE_COLLECTION)
    .where({ rightsNo })
    .limit(1)
    .get();
  if (!res.data || res.data.length === 0)
    throw new Error("After service not found");
  return res.data[0];
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

async function getOrderById(orderId) {
  if (!orderId) return null;
  const res = await db.collection(ORDER_COLLECTION).doc(orderId).get();
  return res.data || null;
}

async function callRefundWorkflow({
  transactionId,
  outRefundNo,
  refundAmount,
  totalAmount,
}) {
  if (!REFUND_WORKFLOW_NAME) {
    throw new Error("Refund workflow not configured");
  }

  const res = await cloud.callFunction({
    name: "cloudbase_module",
    data: {
      name: REFUND_WORKFLOW_NAME,
      data: {
        transaction_id: transactionId,
        out_refund_no: outRefundNo,
        amount: {
          refund: refundAmount,
          total: totalAmount,
          currency: "CNY",
        },
      },
    },
  });

  const result = res && res.result;
  if (!result) {
    throw new Error("Refund workflow failed");
  }
  if (result.success === false) {
    throw new Error(result.message || result.msg || "Refund workflow failed");
  }
  return result;
}
