const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION = "address";

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload } = event;

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  try {
    switch (action) {
      case "add":
        return await addAddress(openId, payload);
      case "update":
        return await updateAddress(openId, payload);
      case "delete":
        return await deleteAddress(openId, payload);
      case "setDefault":
        return await setDefaultAddress(openId, payload);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[manageAddress] error:", err);
    return { success: false, message: err.message };
  }
};

async function addAddress(openId, addressData) {
  if (addressData.isDefault) {
    await unsetAllDefault(openId);
  }

  // Explicitly set openid
  const data = {
    ...addressData,
    _openid: openId,
    isValid: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fullAddress: `${addressData.provinceName}${addressData.cityName}${addressData.districtName}${addressData.detailAddress}`,
  };

  const res = await db.collection(COLLECTION).add({ data });
  return { success: true, _id: res._id };
}

async function updateAddress(openId, { _id, addressData }) {
  if (addressData.isDefault) {
    await unsetAllDefault(openId, _id);
  }

  const data = {
    ...addressData,
    updatedAt: Date.now(),
    fullAddress: `${addressData.provinceName}${addressData.cityName}${addressData.districtName}${addressData.detailAddress}`,
  };

  // Remove _id and _openid from data if present to avoid update errors
  delete data._id;
  delete data._openid;

  await db
    .collection(COLLECTION)
    .where({
      _id: _id,
      _openid: openId,
    })
    .update({ data });

  return { success: true };
}

async function deleteAddress(openId, { _id }) {
  // Soft delete
  await db
    .collection(COLLECTION)
    .where({
      _id: _id,
      _openid: openId,
    })
    .update({
      data: {
        isValid: false,
        updatedAt: Date.now(),
      },
    });
  return { success: true };
}

async function setDefaultAddress(openId, { _id }) {
  await unsetAllDefault(openId, null);

  await db
    .collection(COLLECTION)
    .where({
      _id: _id,
      _openid: openId,
    })
    .update({
      data: {
        isDefault: true,
        updatedAt: Date.now(),
      },
    });
  return { success: true };
}

async function unsetAllDefault(openId, excludeId) {
  const where = {
    _openid: openId,
    isDefault: true,
    isValid: true,
  };
  if (excludeId) {
    where._id = _.neq(excludeId);
  }

  await db
    .collection(COLLECTION)
    .where(where)
    .update({
      data: {
        isDefault: false,
        updatedAt: Date.now(),
      },
    });
}
