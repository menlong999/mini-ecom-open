const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const USER_COLLECTION = "user_info";

const DistributorStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
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
        return await listDistributors(payload);
      case "approve":
        return await approveDistributor(payload, adminInfo);
      case "reject":
        return await rejectDistributor(payload, adminInfo);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageDistributor] error:", err);
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
  return { openId, nickName: user.nickName || "管理员" };
}

async function listDistributors({
  page = 1,
  pageSize = 20,
  status = "ALL",
  keyword = "",
}) {
  const skip = (page - 1) * pageSize;
  let where = {};

  if (status && status !== "ALL") {
    where.distributorStatus = status;
  } else {
    where.distributorStatus = _.in([
      DistributorStatus.PENDING,
      DistributorStatus.APPROVED,
      DistributorStatus.REJECTED,
    ]);
  }

  if (keyword && keyword.trim()) {
    where.nickName = db.RegExp({
      regexp: keyword,
      options: "i",
    });
  }

  const countRes = await db.collection(USER_COLLECTION).where(where).count();
  const total = countRes.total || 0;

  const listRes = await db
    .collection(USER_COLLECTION)
    .where(where)
    .orderBy("distributorApplyAt", "desc")
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

async function approveDistributor({ openid }, adminInfo) {
  if (!openid) throw new Error("Missing openid");
  const userRes = await db
    .collection(USER_COLLECTION)
    .where({ _openid: openid })
    .limit(1)
    .get();
  if (!userRes.data || userRes.data.length === 0)
    throw new Error("User not found");
  const user = userRes.data[0];

  const now = Date.now();
  const nextRole = user.role === "admin" ? user.role : "distributor";
  await db
    .collection(USER_COLLECTION)
    .where({ _openid: openid })
    .update({
      data: {
        distributorStatus: DistributorStatus.APPROVED,
        distributorApprovedAt: now,
        distributorRejectedAt: null,
        distributorRejectReason: "",
        role: nextRole,
        updatedAt: now,
      },
    });

  return { success: true };
}

async function rejectDistributor({ openid, reason = "" }, adminInfo) {
  if (!openid) throw new Error("Missing openid");
  const userRes = await db
    .collection(USER_COLLECTION)
    .where({ _openid: openid })
    .limit(1)
    .get();
  if (!userRes.data || userRes.data.length === 0)
    throw new Error("User not found");
  const user = userRes.data[0];

  if (user.distributorStatus !== DistributorStatus.PENDING) {
    throw new Error("Status not allowed");
  }

  const now = Date.now();
  const nextRole = user.role === "distributor" ? "user" : user.role;
  await db
    .collection(USER_COLLECTION)
    .where({ _openid: openid })
    .update({
      data: {
        distributorStatus: DistributorStatus.REJECTED,
        distributorRejectedAt: now,
        distributorRejectReason: reason || "审核拒绝",
        role: nextRole,
        updatedAt: now,
      },
    });

  return { success: true };
}
