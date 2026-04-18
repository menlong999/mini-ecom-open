const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const AFTER_SERVICE_COLLECTION = "after-service";

// 超时设置：10天
const TIMEOUT_MS = 10 * 24 * 60 * 60 * 1000;
const AFTER_SERVICE_IN_PROGRESS = [10, 20, 30, 40];

exports.main = async (event, context) => {
  console.log("[confirmReceiptTimer] start execution");

  // 1. 计算超时阈值
  const now = Date.now();
  const threshold = now - TIMEOUT_MS;

  // 2. 查询待处理的收货超时订单
  // 条件: status = PENDING_RECEIPT AND shippedTime < threshold
  // 限制单次处理 20 条
  const ordersRes = await db
    .collection("order")
    .where({
      status: "PENDING_RECEIPT",
      shippedTime: _.lt(threshold),
    })
    .limit(20)
    .get();

  const orders = ordersRes.data || [];
  console.log(`[confirmReceiptTimer] found ${orders.length} orders to confirm`);

  if (orders.length === 0) {
    return { success: true, message: "No orders to confirm" };
  }

  const results = [];

  // 3. 逐个处理
  for (const order of orders) {
    const orderId = order._id;
    const result = { orderId, success: false };

    console.log(
      `[confirmReceiptTimer] processing order: ${orderId}, orderNo: ${order.orderNo}`
    );

    try {
      const serviceCount = await db
        .collection(AFTER_SERVICE_COLLECTION)
        .where({
          orderId: orderId,
          status: _.in(AFTER_SERVICE_IN_PROGRESS),
        })
        .count();

      if (serviceCount.total > 0) {
        console.log(
          `[confirmReceiptTimer] skip order ${orderId}: after service in progress`
        );
        result.error = "After service in progress";
        results.push(result);
        continue;
      }

      await db.runTransaction(async (transaction) => {
        // 3.1 再次检查状态
        const freshOrder = await transaction
          .collection("order")
          .doc(orderId)
          .get();
        if (freshOrder.data.status !== "PENDING_RECEIPT") {
          throw new Error("Order status changed, skip");
        }

        // 3.2 更新订单状态为 COMPLETED
        await transaction
          .collection("order")
          .doc(orderId)
          .update({
            data: {
              status: "COMPLETE",
              updatedAt: Date.now(),
            },
          });
      });

      result.success = true;
      console.log(
        `[confirmReceiptTimer] order ${orderId} confirmed successfully`
      );
    } catch (err) {
      console.error(
        `[confirmReceiptTimer] failed to confirm order ${orderId}:`,
        err
      );
      result.error = err.message;
    }

    results.push(result);
  }

  // 4. 返回总结
  return {
    success: true,
    processed: orders.length,
    results,
  };
};
