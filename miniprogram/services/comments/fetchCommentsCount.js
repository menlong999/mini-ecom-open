import { config } from '../../config/index';

/** 获取商品评论数 */
/** 获取商品评论数 */
export async function fetchCommentsCount(spuId = 0) {
  console.log('Fetching comments count for spuId:', spuId);

  const app = getApp();
  try {
    // 查询所有评论
    const res = await app.cloudModels.comments.list({
      filter: { where: { spuId: { $eq: `${spuId}` } } },
      getCount: true,
      // 可根据需要分页或全部拉取
    });

    const records = res?.data?.records || [];
    const commentCount = records.length;
    let goodCount = 0,
      badCount = 0,
      middleCount = 0,
      hasImageCount = 0;
    const uidSet = new Set();

    records.forEach((item) => {
      if (item.commentScore === 5 || item.commentScore === 4) goodCount++;
      else if (item.commentScore === 3) middleCount++;
      else if (item.commentScore === 1) badCount++;
      if (
        (Array.isArray(item.commentResources) &&
          item.commentResources.some((r) => r.type === 'image')) ||
        (Array.isArray(item.commentImageUrls) && item.commentImageUrls.length > 0)
      ) {
        hasImageCount++;
      }
      if (item.uid) uidSet.add(item.uid);
    });

    const goodRate = commentCount ? (goodCount / commentCount) * 100 : 0;

    const retobj = {
      commentCount: `${commentCount}`,
      badCount: `${badCount}`,
      middleCount: `${middleCount}`,
      goodCount: `${goodCount}`,
      hasImageCount: `${hasImageCount}`,
      goodRate: Number(goodRate.toFixed(1)),
      uidCount: `${uidSet.size}`,
    };
    console.log('[fetchCommentsCount] result:', retobj);
    return retobj;
  } catch (error) {
    console.error('[fetchCommentsCount] failed:', error);
    return {
      commentCount: '0',
      badCount: '0',
      middleCount: '0',
      goodCount: '0',
      hasImageCount: '0',
      goodRate: 0,
      uidCount: '0',
    };
  }
}
