Page({
  data: {
    totalPaid: 0,
    orderNo: '',
    groupId: '',
    groupon: null,
    spu: null,
    adUrl: '',
  },

  onLoad(options) {
    const { totalPaid = 0, orderId = '', orderNo = '', groupId = '' } = options;
    this.setData({
      totalPaid,
      orderId: orderId || orderNo,
      groupId,
    });
  },

  onTapReturn(e) {
    const target = e.currentTarget.dataset.type;
    const { orderId } = this.data;
    if (target === 'home') {
      wx.switchTab({ url: '/pages/home/home' });
    } else if (target === 'orderList') {
      wx.navigateTo({
        url: `/pages/order/order-list/index`,
      });
    } else if (target === 'order') {
      wx.navigateTo({
        url: `/pages/order/order-detail/index?orderId=${orderId}`,
      });
    }
  },

  navBackHandle() {
    wx.navigateBack();
  },
});
