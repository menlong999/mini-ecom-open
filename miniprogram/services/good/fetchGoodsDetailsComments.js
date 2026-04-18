import { config } from '../../config/index';

export function getGoodsDetailsCommentsCount(spuId = 0) {
  console.log('Fetching comments count for spuId:', spuId);

  const app = getApp();
  // 查询所有评论
  return app.cloudModels.comments
    .list({
      filter: { where: { spuId: { $eq: `${spuId}` } } },
      getCount: true,
      // 可根据需要分页或全部拉取
    })
    .then((res) => {
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
      console.log('Comments count result:', retobj);
      return retobj;
    });
}

/** 获取商品详情页评论 */
export function getGoodsDetailsCommentsList(spuId = 0) {
  console.log('Fetching comments for spuId:', spuId);
  const app = getApp();
  // 使用云函数调用获取商品详情页评论
  return app.cloudModels.comments
    .list({
      filter: { where: { spuId: { $eq: `${spuId}` } } },
      // 获取全部评论 TODO: 分页
      // pageSize,
      // pageNumber: pageIndex,
      getCount: true,
    })
    .then((res) => {
      const records = res?.data?.records || [];
      const total = res?.data?.total || 0;
      if (!Array.isArray(records) || records.length === 0) {
        console.log('No comments records found');
        return {
          homePageComments: [],
        };
      }
      // 只返回最近一条评论
      const latestComment = records[0];
      return {
        homePageComments: [
          {
            spuId: latestComment.spuId,
            skuId: null,
            specInfo: null,
            commentContent: latestComment.commentContent || '暂无评论',
            commentScore: latestComment.commentScore || 0,
            uid: latestComment.uid,
            userName: latestComment.userName || '匿名用户',
            userHeadUrl:
              latestComment.userHeadUrl ||
              'https://wx.qlogo.cn/mmopen/vi_32/5mKrvn3ibyDNaDZSZics3aoKlz1cv0icqn4EruVm6gKjsK0xvZZhC2hkUkRWGxlIzOEc4600JkzKn9icOLE6zjgsxw/132',
          },
        ],
      };
    });
}
