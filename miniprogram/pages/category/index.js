import { getCategoryList } from '../../services/good/fetchCategoryList';
Page({
  data: {
    list: [],
  },
  async loadCategoryList() {
    try {
      const result = await getCategoryList();
      this.setData({
        list: result,
      });
    } catch (error) {
      console.error('err:', error);
    }
  },

  onShow() {
    this.getTabBar().init();
  },

  handleCategoryChange(e) {
    const { item } = e.detail;
    // 传递分类 ID 和名称到商品列表页
    const categoryId = item.groupId || '';
    const categoryName = encodeURIComponent(item.name || '');
    wx.navigateTo({
      url: `/pages/goods/list/index?categoryId=${categoryId}&categoryName=${categoryName}`,
    });
  },

  onLoad() {
    this.loadCategoryList(true);
  },
});
