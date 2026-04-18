import { CancelResonTypes } from './orderConfig';

/**
 * 获取订单详情
 * @param {String}  orderId
 * @returns {Promise<Object>}
 */
export async function fetchOrderDetail(orderId) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  if (!userInfo._openid) {
    throw new Error('用户未登录');
  }
  console.log('Fetching order:', orderId);
  const db = wx.cloud.database();
  const res = await db
    .collection('order')
    .where({
      _id: orderId,
      _openid: userInfo._openid,
    })
    .limit(1)
    .get();
  console.log('Order fetch result:', res);
  const order = res && res.data && res.data.length ? res.data[0] : null;
  if (!order) {
    throw new Error('No order found for: ' + orderId);
  }

  if (!order.logistics) {
    order.logistics = normalizeLogistics(order);
  }

  // 直接返回订单数据
  return order;
}

export async function cancelOrder(order) {
  console.log('Cancelling order:', order);
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageOrder',
      data: {
        action: 'cancel',
        payload: {
          orderId: order._id,
          currentStatus: order.status,
          cancelReason: order.cancelReson || CancelResonTypes.OTHER,
          cancelReasonDesc: order.cancelReasonDesc || '',
        },
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error((res.result && res.result.message) || '取消订单失败');
    }
    return res.result;
  } catch (error) {
    console.error('Cancel order failed:', error);
    throw error;
  }
}

export async function deleteOrder(order) {
  console.log('Deleting order:', order);
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageOrder',
      data: {
        action: 'delete',
        payload: {
          orderId: order._id,
        },
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error((res.result && res.result.message) || '删除订单失败');
    }
    return res.result;
  } catch (error) {
    console.error('Delete order failed:', error);
    throw error;
  }
}

// 确认收货
export async function confirmReceipt(orderId) {
  console.log('Confirm receipt for:', orderId);
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageOrder',
      data: {
        action: 'confirmReceipt',
        payload: {
          orderId: orderId,
        },
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error((res.result && res.result.message) || '确认收货失败');
    }
    return res.result;
  } catch (error) {
    console.error('Confirm receipt failed:', error);
    throw error;
  }
}

function normalizeLogistics(order) {
  const logistics = {};
  if (order.logisticsNo) logistics.logisticsNo = order.logisticsNo;
  if (order.companyCode) logistics.companyCode = order.companyCode;
  if (order.companyName) logistics.companyName = order.companyName;
  if (order.remark) logistics.remark = order.remark;
  if (order.operator) logistics.operator = order.operator;
  if (order.openid) logistics.openid = order.openid;
  if (order.updatedAt) logistics.updatedAt = order.updatedAt;
  return logistics;
}
