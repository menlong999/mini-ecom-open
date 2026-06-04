/**
 * 创建商品评价
 * @param {Object} data 评价数据
 */
/**
 * 创建商品评价 (批量)
 * @param {Array<Object>} commentList 评价数据列表
 */
export async function createCommentsBatch(commentList) {
  console.log('[createCommentsBatch] start, list:', commentList);
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageComments',
      data: {
        action: 'create',
        payload: commentList,
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error(res.result?.message || '评价提交失败');
    }

    console.log('[createCommentsBatch] success, res:', res);
    return res.result;
  } catch (error) {
    console.error('[createCommentsBatch] failed:', error);
    throw error;
  }
}

/**
 * 创建商品评价 (单条 - 兼容旧调用)
 * @param {Object} data 评价数据
 */
export async function createComment(data) {
  return createCommentsBatch([data]);
}
