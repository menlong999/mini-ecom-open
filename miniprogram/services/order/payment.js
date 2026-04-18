function normalizePaymentParams(params) {
  const normalized = { ...params };
  if (normalized.packageVal && !normalized.package) {
    normalized.package = normalized.packageVal;
  }
  return normalized;
}

/**
 * 提交支付 (获取支付参数)
 */
async function dispatchCommitPay(params) {
  const { orderId } = params;
  const userInfo = wx.getStorageSync('userInfo');

  if (!userInfo || !userInfo._openid) {
    throw new Error('用户未登录，无法支付');
  }

  console.log('dispatch commit pay:', params);

  const res = await wx.cloud.callFunction({
    name: 'unifiedOrder',
    data: {
      orderId,
      payerOpenId: userInfo._openid,
    },
  });

  console.log('unifiedOrder result:', res);

  if (!res || !res.result || res.result.code !== 0) {
    throw new Error(res.result?.message || '获取支付参数失败');
  }

  return res.result.data;
}

export async function getPaymentParams({ orderId }) {
  const params = await dispatchCommitPay({ orderId });
  return normalizePaymentParams(params);
}
