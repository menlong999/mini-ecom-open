const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION = "cart";

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload } = event;

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  console.log(
    "[manageCart] action:",
    action,
    "payload:",
    payload,
    "openId:",
    openId
  );

  try {
    switch (action) {
      case "add":
        return await addToCart(openId, payload);
      case "updateQuantity":
        return await updateQuantity(openId, payload);
      case "updateSelection":
        return await updateSelection(openId, payload);
      case "selectAll":
        return await selectAll(openId, payload);
      case "delete":
        return await deleteItems(openId, payload);
      case "clearInvalid":
        return await clearInvalid(openId);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[manageCart] error:", err);
    return { success: false, message: err.message };
  }
};

async function addToCart(openId, { goods }) {
  // Determine uniqueness by spuId + skuId
  const { spuId, skuId, quantity } = goods;

  // Check exist
  const res = await db
    .collection(COLLECTION)
    .where({
      _openid: openId,
      spuId: spuId,
      skuId: skuId,
    })
    .get();

  if (res.data.length > 0) {
    // Update
    const oldItem = res.data[0];
    await db
      .collection(COLLECTION)
      .doc(oldItem._id)
      .update({
        data: {
          quantity: _.inc(quantity),
          updatedAt: Date.now(),
        },
      });
  } else {
    // Create
    await db.collection(COLLECTION).add({
      data: {
        ...goods,
        _openid: openId,
        isSelected: true, // Default selected
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
  }
  return { success: true };
}

async function updateQuantity(openId, { spuId, skuId, quantity }) {
  await db
    .collection(COLLECTION)
    .where({
      _openid: openId,
      spuId: spuId,
      skuId: skuId,
    })
    .update({
      data: {
        quantity: quantity,
        updatedAt: Date.now(),
      },
    });
  return { success: true };
}

async function updateSelection(openId, { spuId, skuId, isSelected }) {
  await db
    .collection(COLLECTION)
    .where({
      _openid: openId,
      spuId: spuId,
      skuId: skuId,
    })
    .update({
      data: {
        isSelected: isSelected,
        updatedAt: Date.now(),
      },
    });
  return { success: true };
}

async function selectAll(openId, { isSelected }) {
  await db
    .collection(COLLECTION)
    .where({
      _openid: openId,
    })
    .update({
      data: {
        isSelected: isSelected,
        updatedAt: Date.now(),
      },
    });
  return { success: true };
}

async function deleteItems(openId, { spuId, skuId }) {
  await db
    .collection(COLLECTION)
    .where({
      _openid: openId,
      spuId: spuId,
      skuId: skuId,
    })
    .remove();
  return { success: true };
}

async function clearInvalid(openId) {
  // Assuming 'valid' field is maintained by system or check dynamically?
  // The previous code checked `valid: false`.
  await db
    .collection(COLLECTION)
    .where({
      _openid: openId,
      valid: false,
    })
    .remove();
  return { success: true };
}
