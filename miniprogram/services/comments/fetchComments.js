import { config } from '../../config/index';

/** 获取商品评论 */
/** 获取商品评论 */
export async function fetchComments(params) {
  const { spuId, page = 1, pageSize = 10, queryType = 'all' } = params;
  console.log('Fetching comments params:', params);
  const app = getApp();

  const where = {
    spuId: { $eq: `${spuId}` },
  };

  // 根据 queryType 构建查询条件
  switch (queryType) {
    case 'good': // 好评 >= 4
      where.commentScore = { $gte: 4 };
      break;
    case 'middle': // 中评 3
      where.commentScore = { $eq: 3 };
      break;
    case 'bad': // 差评 <= 2
      where.commentScore = { $lte: 2 };
      break;
    case 'image': // 有图
      // 假设 SDK 支持这种查询，或者需要根据实际数据结构调整
      // 数据结构: commentResources: [{ type: 'image', src: '...' }]
      // JSON 数组查询可能复杂，这里尝试用 $where 或 SDK 支持的数组查询
      // 如果不支持复杂查询，可能需要 fallback 或者依赖后端聚合
      // 简单尝试: commentResources 存在且长度 > 0
      // CloudBase NoSQL 通常支持 'commentResources.0': { $exists: true }
      where.commentResources = { $nempty: true };
      break;
    default:
      break;
  }

  console.log('[fetchComments] build query where:', where);

  try {
    const res = await app.cloudModels.comments.list({
      filter: { where },
      pageSize,
      pageNumber: page,
      getCount: true,
      orderBy: [{ createdAt: 'desc' }],
    });

    const records = res?.data?.records || [];
    const total = res?.data?.total || 0;
    console.log(`[fetchComments] success, fetched ${records.length} records, total: ${total}`);

    return {
      commentList: records.map((item) => ({
        spuId: item.spuId,
        skuId: item.skuId || null,
        specs: item.specs || null,
        commentContent: item.commentContent || '暂无评论',
        commentScore: item.commentScore || 5,
        userName: item.userName || '微信用户',
        userHeadUrl: item.userHeadUrl || '',
        commentResources: item.commentResources || [],
        isAnonymity: item.isAnonymity || false,
        commentTime: item.createdAt,
        isAutoComment: item.isAutoComment || false,
        sellerReply: item.sellerReply || '',
        goods: item.goods || {},
        commentId: item._id,
      })),
      total,
    };
  } catch (error) {
    console.error('Fetch comments failed:', error);
    return {
      commentList: [],
      total: 0,
    };
  }
}
