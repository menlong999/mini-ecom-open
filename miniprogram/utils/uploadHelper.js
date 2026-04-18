/**
 * 批量上传图片或文件
 * 自动识别 cloud:// 和 http:// 链接跳过上传
 * @param {Array} files - 文件列表 [{url: '...'}, ...]
 * @param {String} folder - 云存储目录名，默认 'common'
 * @returns {Promise<Array>} - 返回文件ID列表 [fileID1, fileID2, ...]
 */
export function uploadImages(files = [], folder = 'common') {
  console.log('[uploadImages] start', { count: files.length, folder });
  const uploadTasks = files.map(async (file) => {
    const fileUrl = file.url || file.path || file.tempFilePath;
    if (!fileUrl) {
      console.warn('[uploadImages] skip empty file url', file);
      return '';
    }

    // 如果已经是云文件ID或网络链接，直接返回
    const isCloud = fileUrl.startsWith('cloud://');
    const isTmpHttp = /^https?:\/\/tmp\//.test(fileUrl);
    const isRemoteHttp = /^https?:\/\//.test(fileUrl) && !isTmpHttp;

    if (isCloud || isRemoteHttp) {
      console.log('[uploadImages] skip existing url', fileUrl);
      return fileUrl;
    }

    // 如果是临时文件，上传
    const tempUrl = fileUrl;
    console.log('[uploadImages] upload temp file', tempUrl);
    // 尝试获取扩展名
    const extMatch = tempUrl.match(/\.[^.]+?$/);
    const ext = extMatch ? extMatch[0] : '.jpg';

    const cloudPath = `${folder}/${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;

    try {
      const res = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempUrl,
      });
      console.log('[uploadImages] uploaded', { tempUrl, cloudPath, fileID: res.fileID });
      return res.fileID;
    } catch (err) {
      console.error('Upload failed', tempUrl, err);
      throw new Error('部分文件上传失败，请重试');
    }
  });

  return Promise.all(uploadTasks).then((fileIDs) => {
    console.log('[uploadImages] done', { count: fileIDs.length });
    return fileIDs;
  });
}
