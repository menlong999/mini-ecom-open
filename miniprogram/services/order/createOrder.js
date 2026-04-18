export async function createOrder({ goodsList, orderData }) {
  if (!Array.isArray(goodsList) || goodsList.length === 0) {
    throw new Error('商品列表为空');
  }

  if (!orderData || typeof orderData !== 'object') {
    throw new Error('订单数据无效');
  }

  const res = await wx.cloud.callFunction({
    name: 'createOrder',
    data: {
      goodsList,
      orderData,
    },
  });

  const result = res && res.result;
  if (!result || !result.success || !result.orderId) {
    throw new Error((result && result.message) || '创建订单失败');
  }

  return result;
}
