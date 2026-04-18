import { fetchGoodsList } from '../../../../services/admin/goodsMgr';
import {
  fetchAllCategories,
  filterCategory2ByCategory1,
} from '../../../../services/admin/categoryService';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    goodsList: [],
    loading: false,
    finished: false,
    page: 1,
    pageSize: 20,
    backRefresh: false,

    // Category data
    category1List: [],
    category2List: [],
    filteredCategory2List: [],

    // Selected filters
    selectedCategory1Id: '',
    selectedCategory2Id: '',
    selectedCategory1Name: '',
    selectedCategory2Name: '',
    selectedCategory1Index: -1,
    selectedCategory2Index: -1,

    // Picker visibility
    showCategory1Picker: false,
    showCategory2Picker: false,
  },

  onLoad() {
    this.loadCategories();
    this.init();
  },

  onShow() {
    if (!this.data.backRefresh) return;
    this.setData({ backRefresh: false }, () => this.refreshGoodsOnly());
  },

  onPullDownRefresh() {
    this.init();
    wx.stopPullDownRefresh();
  },

  async loadCategories() {
    try {
      const { category1List, category2List } = await fetchAllCategories();
      this.setData({
        category1List,
        category2List,
      });
      console.log(
        '[loadCategories] Loaded',
        category1List.length,
        'L1 and',
        category2List.length,
        'L2 categories'
      );
    } catch (err) {
      console.error('[loadCategories] Error:', err);
    }
  },

  init() {
    this.setData({
      goodsList: [],
      page: 1,
      finished: false,
      loading: true,
    });
    this.loadGoods();
    this.loadCategories();
  },

  refreshGoodsOnly() {
    this.setData({
      goodsList: [],
      page: 1,
      finished: false,
      loading: true,
    });
    this.loadGoods();
  },

  async loadGoods() {
    const { page, pageSize, selectedCategory2Id } = this.data;
    try {
      const res = await fetchGoodsList({
        page,
        pageSize,
        categoryId: selectedCategory2Id,
      });
      const { list, total } = res;

      this.setData({
        goodsList: list,
        loading: false,
        finished: list.length < pageSize || pageSize * page >= total,
      });
    } catch (err) {
      console.error(err);
      this.setData({ loading: false });
      Toast({ context: this, selector: '#t-toast', message: '加载失败' });
    }
  },

  // Category 1 picker
  onShowCategory1Picker() {
    this.setData({ showCategory1Picker: true });
  },

  onCategory1PickerChange(e) {
    const { value } = e.detail;
    const selectedId = value[0];
    const index = this.data.category1List.findIndex((item) => item._id === selectedId);
    const category1 = this.data.category1List[index];

    if (category1) {
      const filteredCategory2List = filterCategory2ByCategory1(
        this.data.category2List,
        category1._id
      );
      this.setData({
        selectedCategory1Id: category1._id,
        selectedCategory1Name: category1.category1Name,
        selectedCategory1Index: index,
        filteredCategory2List,
        // Reset category 2
        selectedCategory2Id: '',
        selectedCategory2Name: '',
        selectedCategory2Index: -1,
      });
    }
    this.setData({ showCategory1Picker: false });
  },

  onCategory1PickerCancel() {
    this.setData({ showCategory1Picker: false });
  },

  // Category 2 picker
  onShowCategory2Picker() {
    if (!this.data.selectedCategory1Id) {
      Toast({ context: this, selector: '#t-toast', message: '请先选择一级分类' });
      return;
    }
    this.setData({ showCategory2Picker: true });
  },

  onCategory2PickerChange(e) {
    const { value } = e.detail;
    const selectedId = value[0];
    const index = this.data.filteredCategory2List.findIndex((item) => item._id === selectedId);
    const category2 = this.data.filteredCategory2List[index];

    if (category2) {
      this.setData(
        {
          selectedCategory2Id: category2._id,
          selectedCategory2Name: category2.category2Name,
          selectedCategory2Index: index,
        },
        () => {
          // Reload goods with filter
          this.init();
        }
      );
    }
    this.setData({ showCategory2Picker: false });
  },

  onCategory2PickerCancel() {
    this.setData({ showCategory2Picker: false });
  },

  // Clear filter
  onClearFilter() {
    this.setData(
      {
        selectedCategory1Id: '',
        selectedCategory2Id: '',
        selectedCategory1Name: '',
        selectedCategory2Name: '',
        selectedCategory1Index: -1,
        selectedCategory2Index: -1,
        filteredCategory2List: [],
      },
      () => {
        this.init();
      }
    );
  },

  onAddGoods() {
    wx.navigateTo({ url: '/pages/admin/goods/edit/index' });
  },

  onEditGoods(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/goods/edit/index?id=${id}` });
  },
});
