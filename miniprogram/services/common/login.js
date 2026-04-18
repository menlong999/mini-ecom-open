/**
 * 登录服务
 */

function cacheUserInfo(userData) {
  if (userData && userData._openid) {
    wx.setStorageSync('userInfo', userData);
  }
}

/**
 * 登录并获取用户信息
 * @param {Object} params - 登录参数 (如 phoneCode)
 */
export function dispatchLogin(params = {}) {
  const referrerOpenid = wx.getStorageSync('referrerOpenid');
  const referrerScene = wx.getStorageSync('referrerScene');
  const nextParams = { ...params };
  if (referrerOpenid && !nextParams.referrerOpenid) {
    nextParams.referrerOpenid = referrerOpenid;
    nextParams.referrerScene = referrerScene || '';
  }
  return wx.cloud
    .callFunction({
      name: 'login',
      data: nextParams,
    })
    .then((res) => {
      const { result } = res;
      if (result && result.code < 300) {
        cacheUserInfo(result.data);
        return result.data;
      }
      throw new Error(result.message || '登录失败');
    });
}

export { cacheUserInfo };
