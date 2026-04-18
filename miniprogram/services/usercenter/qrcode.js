/**
 * 生成用户专属二维码
 */
export function generateUserQRCode() {
  return wx.cloud
    .callFunction({
      name: 'generateQRCode',
    })
    .then((res) => {
      const { result } = res;
      if (result && (result.code === 0 || result.code === 202)) {
        return {
          ...(result.data || {}),
          _message: result.message || '',
          _code: result.code,
        };
      }
      throw new Error(result && result.message ? result.message : '生成二维码失败');
    });
}
