const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const COLLECTION = "comments";

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload } = event;

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  try {
    switch (action) {
      case "create":
        return await createComments(openId, payload);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[manageComments] error:", err);
    return { success: false, message: err.message };
  }
};

async function createComments(openId, commentDataList) {
  if (!Array.isArray(commentDataList) || commentDataList.length === 0) {
    return { success: false, message: "No comment data provided" };
  }

  // Ensure all comments belong to the current user
  const comments = commentDataList.map((item) => ({
    ...item,
    _openid: openId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  // Optional: Validation check if order belongs to user or already commented
  // Skipping complex validation for now to match current parity,
  // but ideally we should check db.collection('orders').doc(orderId) here.

  // [New] 强校验：检查是否是自己的订单
  // 假设这一批评论都属于同一个 orderId (前端逻辑如此)
  const orderId = commentDataList[0].orderId;
  if (orderId) {
    const orderRes = await db
      .collection("order")
      .where({
        _id: orderId,
        _openid: openId,
      })
      .count();

    if (orderRes.total === 0) {
      return { success: false, message: "Permission denied: Order not found" };
    }

    // [New] 检查是否已经评价过该订单
    const commentedRes = await db
      .collection(COLLECTION)
      .where({
        orderId: orderId,
        _openid: openId,
      })
      .count();

    if (commentedRes.total > 0) {
      return { success: false, message: "该订单已评价，请勿重复提交" };
    }
  } else {
    return { success: false, message: "Missing orderId in comments" };
  }

  try {
    // CloudBase DB doesn't support bulk insert nicely via db.collection.add only accepts one or (in some sdks) array?
    // wx-server-sdk 'add' documentation says: "add one record".
    // Actually, db.collection('todos').add({ data: [...] }) allows array since older versions?
    // Let's safe-guard by checking support or looping.
    // Official docs say 'add' data can be object or array of objects.

    const res = await db.collection(COLLECTION).add({
      data: comments,
    });

    // Update Order status if needed (e.g. set status to 'finished' or logic hook)
    // Set isCommented to true
    // 这里的实现，只要订单中某个 sku 的评论成功，就将订单的 isCommented 设置为 true
    // 这是简便实现
    if (orderId) {
      await db
        .collection("order")
        .doc(orderId)
        .update({
          data: {
            isCommented: true,
          },
        });
    }

    return { success: true, count: comments.length, ids: res._ids };
  } catch (err) {
    console.error("[manageComments] create failed:", err);
    throw err;
  }
}
