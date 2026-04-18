import { fetchComments } from '../../../services/comments/fetchComments';
import { fetchCommentsCount } from '../../../services/comments/fetchCommentsCount';
import Toast from 'tdesign-miniprogram/toast/index';
import dayjs from 'dayjs';

Page({
  data: {
    commentList: [],
    countObj: {
      badCount: '0',
      commentCount: '0',
      goodCount: '0',
      middleCount: '0',
      hasImageCount: '0',
      uidCount: '0',
    },
    spuId: '',
    currentTab: 'all',
    page: 1,
    pageSize: 10,
    hasMore: true,
    hasLoaded: false,
    loadMoreStatus: 0,
  },

  onLoad(options) {
    const spuId = options.spuId || '';
    const commenttype = options.commenttype || 'all';
    this.setData({ spuId, currentTab: commenttype });
    this.initFetch();
  },

  onReachBottom() {
    if (this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.fetchCommentsData(true);
    }
  },

  async initFetch() {
    this.setData({ page: 1, hasMore: true, loadMoreStatus: 1 });
    await this.fetchCommentsData(false);
  },

  async fetchCommentsData(isAppend) {
    const { spuId, currentTab, page, pageSize } = this.data;
    if (!spuId) return;

    console.log('[fetchCommentsData] start:', { spuId, currentTab, page, isAppend });

    try {
      const promises = [fetchComments({ spuId, page, pageSize, queryType: currentTab })];

      // 仅在初始化或切换 Tab 时获取统计信息，也可每次获取视业务需求
      if (!isAppend && page === 1) {
        promises.push(fetchCommentsCount(spuId));
      }

      const results = await Promise.all(promises);
      const commentsResult = results[0];
      const countResult = results[1] || this.data.countObj;

      console.log('[fetchCommentsData] results:', {
        commentsTotal: commentsResult?.total,
        currentListLen: commentsResult?.commentList?.length,
        countData: countResult,
      });

      const newComments = (commentsResult?.commentList || []).map((item, idx) => ({
        ...item,
        commentTime: item.commentTime
          ? dayjs(Number(item.commentTime)).format('YYYY/MM/DD HH:mm')
          : '',
        uindex: `${item._id || ''}_${page}_${idx}`,
      }));

      const total = commentsResult?.total || 0;
      const currentCount = isAppend
        ? this.data.commentList.length + newComments.length
        : newComments.length;
      const hasMore = currentCount < total;

      this.setData({
        commentList: isAppend ? [...this.data.commentList, ...newComments] : newComments,
        countObj: countResult,
        hasLoaded: true,
        hasMore,
        loadMoreStatus: hasMore ? 0 : 2,
      });
    } catch (error) {
      console.error('[fetchCommentsData] error:', error);
      Toast({ context: this, selector: '#t-toast', message: '获取评论失败' });
      this.setData({ hasLoaded: true, loadMoreStatus: 2 });
    }
  },

  handleTagChange(e) {
    const { commenttype } = e.currentTarget.dataset;
    if (commenttype === this.data.currentTab) return;
    this.setData({ currentTab: commenttype, commentList: [] }); // 清空列表
    this.initFetch();
  },

  handleImagePreview(e) {
    const { src } = e.currentTarget.dataset;
    const { uindex } = e.currentTarget.dataset;
    // 找到对应的评论项
    const comment = this.data.commentList.find((item) => item.uindex === uindex);

    if (comment && comment.commentResources) {
      const urls = comment.commentResources.map((res) => res.src || res.coverSrc);
      wx.previewImage({
        current: src,
        urls,
      });
    } else if (src) {
      wx.previewImage({
        current: src,
        urls: [src],
      });
    }
  },
});
