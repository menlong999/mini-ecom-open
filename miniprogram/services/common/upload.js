/**
 * 文件上传服务
 */

/**
 * 上传文件到云存储
 * @param {string} cloudPath - 云存储路径
 * @param {string} filePath - 本地文件路径
 */
export function uploadFile(cloudPath, filePath) {
  return wx.cloud.uploadFile({
    cloudPath,
    filePath,
  });
}
