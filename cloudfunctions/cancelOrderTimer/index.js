const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

// 超时设置：24小时
const TIMEOUT_MS = 60 * 60 * 1000; // 1小时超时

exports.main = async (event, context) => {
  console.log("[cancelOrderTimer] start execution");

  // 1. 计算超时阈值 (当前时间 - 24小时)
  const now = Date.now();
  const threshold = now - TIMEOUT_MS;

  // 2. 查询待处理的超时订单
  // 条件: status = PENDING_PAYMENT AND createdAt < threshold
  // 限制单次处理 20 条，避免函数超时
  const ordersRes = await db
    .collection("order")
    .where({
      status: "PENDING_PAYMENT",
      // 注意：createdAt 存的是数字时间戳或数字字符串，这里假设是数字比较
      // 如果 createOrder 存的是字符串，需要调整。
      // createOrder 中是: createdAt: ts (number)
      createdAt: _.lt(threshold),
    })
    .limit(20)
    .get();

  const orders = ordersRes.data || [];
  console.log(`[cancelOrderTimer] found ${orders.length} orders to cancel`);

  if (orders.length === 0) {
    return { success: true, message: "No orders to cancel" };
  }

  const results = [];

  // 3. 逐个处理 (为了安全起见，每个订单单独开启事务，避免一个失败导致全部失败)
  // 虽然批量效率低，但作为定时任务，稳健性更重要
  for (const order of orders) {
    const orderId = order._id;
    const result = { orderId, success: false };

    console.log(
      `[cancelOrderTimer] processing order: ${orderId}, orderNo: ${order.orderNo}`
    );

    try {
      await db.runTransaction(async (transaction) => {
        // 3.1 再次检查状态 (防止并发处理)
        const freshOrder = await transaction
          .collection("order")
          .doc(orderId)
          .get();
        if (freshOrder.data.status !== "PENDING_PAYMENT") {
          throw new Error("Order status changed, skip");
        }

        // 3.2 恢复库存
        if (order.goodsList && order.goodsList.length > 0) {
          for (const item of order.goodsList) {
            if (item.skuId && item.quantity) {
              // 先查 sku
              const skuRes = await transaction
                .collection("goods_sku")
                .where({
                  skuId: item.skuId,
                })
                .get();

              if (skuRes.data && skuRes.data.length > 0) {
                const skuDocId = skuRes.data[0]._id;
                // 增加库存
                await transaction
                  .collection("goods_sku")
                  .doc(skuDocId)
                  .update({
                    data: {
                      stock: _.inc(item.quantity),
                    },
                  });
                console.log(
                  `[cancelOrderTimer] restored stock for sku: ${item.skuId}, qty: ${item.quantity}`
                );
              } else {
                console.warn(
                  `[cancelOrderTimer] sku not found: ${item.skuId}, skip stock restore`
                );
              }
            }
          }
        }

        // 3.3 更新订单状态
        await transaction
          .collection("order")
          .doc(orderId)
          .update({
            data: {
              status: "PAYMENT_TIMEOUT",
              cancelReason: "PAYMENT_TIMEOUT",
              cancelReasonDesc: "支付超时自动取消",
              cancelTime: `${Date.now()}`,
              updatedAt: Date.now(),
            },
          });
      });

      result.success = true;
      console.log(`[cancelOrderTimer] order ${orderId} cancelled successfully`);
    } catch (err) {
      console.error(
        `[cancelOrderTimer] failed to cancel order ${orderId}:`,
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
