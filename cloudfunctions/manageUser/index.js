const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const COLLECTION = "user_info";

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload } = event;

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  try {
    switch (action) {
      case "updateInfo":
        return await updateInfo(openId, payload);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[manageUser] error:", err);
    return { success: false, message: err.message };
  }
};

async function updateInfo(openId, updateData) {
  // Whitelist allow fields if needed for strict security,
  // or just ensure sensitive fields like openid/_id are not overwritten
  const safeData = { ...updateData };
  delete safeData._id;
  delete safeData._openid;
  delete safeData.role;
  delete safeData.distributorStatus;
  delete safeData.distributorApplyAt;
  delete safeData.distributorApprovedAt;
  delete safeData.distributorRejectedAt;
  delete safeData.distributorRejectReason;
  delete safeData.distributorQrFileId;
  delete safeData.referrerOpenid;
  delete safeData.referrerScene;
  delete safeData.referrerAt;

  // Add update time
  safeData.updatedAt = Date.now();

  // Check if user exists first? Assuming user entry created at login.
  // If not, might need upsert logic.
  // "update" in CloudBase usually only updates if doc exists.
  // Let's safe check:
  const userRes = await db
    .collection(COLLECTION)
    .where({ _openid: openId })
    .get();

  if (userRes.data.length === 0) {
    // Create if not exists (should rarely happen in this flow if login logic is solid)
    await db.collection(COLLECTION).add({
      data: {
        ...safeData,
        _openid: openId,
        createdAt: Date.now(),
      },
    });
  } else {
    await db.collection(COLLECTION).where({ _openid: openId }).update({
      data: safeData,
    });
  }

  return { success: true };
}
