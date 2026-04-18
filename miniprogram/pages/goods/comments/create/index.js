import { createComment, createCommentsBatch } from '../../../../services/comments/createComment';
import { uploadFile } from '../../../../services/common/upload';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    serviceRateValue: 5,
    conveyRateValue: 5,
    isAnonymous: false,
    goodsList: [],
    gridConfig: {
      width: 218,
      height: 218,
      column: 3,
    },
    isAllowedSubmit: false,
    imageProps: {
      mode: 'aspectFit',
    },
  },

  onLoad() {
    const order = wx.getStorageSync('currentEvaluateOrder');
    if (!order) {
      wx.navigateBack();
      return;
    }

    this.order = order;

    // 初始化每个商品的评价数据
    const goodsList = (order.goodsList || []).map((goods) => ({
      ...goods,
      goodRateValue: 5,
      textAreaValue: '',
      uploadFiles: [],
    }));

    this.setData({
      goodsList,
    });
  },

  handleRateChange(e) {
    const { value } = e?.detail;
    const { index, item } = e.currentTarget.dataset;

    if (index !== undefined) {
      // 商品维度的评分
      const key = `goodsList[${index}].${item}`;
      this.setData({ [key]: value }, () => this.updateButtonStatus());
    } else {
      // 订单维度的评分 (物流/服务)
      this.setData({ [item]: value }, () => this.updateButtonStatus());
    }
  },

  handleAnonymousChange(e) {
    const status = !!e?.detail?.checked;
    this.setData({ isAnonymous: status });
  },

  handleSuccess(e) {
    const { files } = e.detail;
    const { index } = e.currentTarget.dataset;
    const key = `goodsList[${index}].uploadFiles`;
    this.setData({ [key]: files });
  },

  handleRemove(e) {
    const { index: fileIndex } = e.detail;
    const { index: goodsIndex } = e.currentTarget.dataset;
    const { uploadFiles } = this.data.goodsList[goodsIndex];
    uploadFiles.splice(fileIndex, 1);
    const key = `goodsList[${goodsIndex}].uploadFiles`;
    this.setData({ [key]: uploadFiles });
  },

  handleTextAreaChange(e) {
    const value = e?.detail?.value;
    const { index } = e.currentTarget.dataset;
    const key = `goodsList[${index}].textAreaValue`;
    this.setData({ [key]: value }, () => this.updateButtonStatus());
  },

  updateButtonStatus() {
    const { serviceRateValue, conveyRateValue } = this.data;
    // 只要有物流和服务评分即可提交，不强制每个商品都写评价
    const isAllowedSubmit = serviceRateValue && conveyRateValue;
    if (isAllowedSubmit !== this.data.isAllowedSubmit) {
      this.setData({ isAllowedSubmit });
    }
  },

  async handleSubmit() {
    const { isAllowedSubmit, goodsList, serviceRateValue, conveyRateValue, isAnonymous } =
      this.data;
    if (!isAllowedSubmit) return;

    wx.showLoading({ title: '提交中...' });

    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const userHeadUrl = userInfo.avatarUrl || '';
      const userName = isAnonymous ? '匿名用户' : userInfo.nickName || '';

      const promises = goodsList.map(async (goods, index) => {
        // 1. 上传该商品的图片/视频
        const commentResources = [];
        if (goods.uploadFiles && goods.uploadFiles.length > 0) {
          const uploadTasks = goods.uploadFiles.map(async (file, fIndex) => {
            const isVideo =
              file.type === 'video' ||
              (file.url && file.url.toLowerCase().match(/\.(mp4|mov|avi|m3u8)$/));
            const ext =
              file.url.substring(file.url.lastIndexOf('.')) || (isVideo ? '.mp4' : '.jpg');
            const cloudPath = `comments/${Date.now()}-${index}-${fIndex}-${Math.floor(
              Math.random() * 1000
            )}${ext}`;

            const fileRes = await uploadFile(cloudPath, file.url);
            const resource = {
              src: fileRes.fileID,
              type: isVideo ? 'video' : 'image',
            };

            const videoThumb = file.thumbTempFilePath || file.thumb;
            if (isVideo && videoThumb) {
              const thumbExt = videoThumb.substring(videoThumb.lastIndexOf('.')) || '.jpg';
              const thumbPath = `comments/covers/${Date.now()}-${index}-${fIndex}-${Math.floor(
                Math.random() * 1000
              )}${thumbExt}`;
              try {
                const thumbRes = await uploadFile(thumbPath, videoThumb);
                resource.coverSrc = thumbRes.fileID;
              } catch (e) {
                console.error('Cover upload failed', e);
              }
            }
            return resource;
          });
          const results = await Promise.all(uploadTasks);
          commentResources.push(...results);
        }

        // 2. 构造单条评论数据
        return {
          spuId: goods.spuId,
          skuId: goods.skuId,
          specs: goods.specs || '', // 改为 specs
          commentContent: goods.textAreaValue || '',
          commentScore: goods.goodRateValue,
          commentResources,
          orderId: this.order.orderId, // User request: use _id
          isAnonymity: isAnonymous,
          userName,
          userHeadUrl,
          goods: goods, // User request: raw goods object
          serviceScore: serviceRateValue,
          logisticsScore: conveyRateValue,
        };
      });

      const commentDataList = await Promise.all(promises);

      // 3. 批量提交
      await createCommentsBatch(commentDataList);

      wx.hideLoading();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '评价提交成功',
        icon: 'check-circle',
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('Submit comment failed:', err);
      wx.hideLoading();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '提交失败，请重试',
        theme: 'error',
      });
    }
  },
});
