import Toast from 'tdesign-miniprogram/toast/index';
import { fetchStockList, addSkuStock } from '../../../services/admin/stockMgr';
import {
  fetchAllCategories,
  filterCategory2ByCategory1,
} from '../../../services/admin/categoryService';

const EMPTY_OPTION = { label: '全部', value: '' };

Page({
  data: {
    list: [],
    loading: false,
    finished: false,
    page: 1,
    pageSize: 20,

    keyword: '',

    category1List: [],
    category2List: [],
    filteredCategory2List: [],

    selectedCategory1Id: '',
    selectedCategory2Id: '',
    selectedCategory1Name: '',
    selectedCategory2Name: '',

    showCategory1Picker: false,
    showCategory2Picker: false,

    stockPopupVisible: false,
    stockInput: '',
    currentSpuIndex: -1,
    currentSkuIndex: -1,
  },

  onLoad() {
    this.loadCategories();
    this.init();
  },

  onPullDownRefresh() {
    this.init();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.loading || this.data.finished) return;
    this.loadList(false);
  },

  async loadCategories() {
    try {
      const { category1List, category2List } = await fetchAllCategories();
      this.setData({
        category1List: [EMPTY_OPTION, ...category1List],
        category2List,
      });
    } catch (err) {
      console.error('[stock] loadCategories error', err);
    }
  },

  init() {
    this.setData({
      list: [],
      page: 1,
      finished: false,
      loading: true,
    });
    this.loadList(true);
  },

  async loadList(reset) {
    const { page, pageSize, keyword, selectedCategory1Id, selectedCategory2Id } = this.data;
    try {
      this.setData({ loading: true });
      const res = await fetchStockList({
        page,
        pageSize,
        keyword,
        category1Id: selectedCategory1Id,
        category2Id: selectedCategory2Id,
      });
      const list = res.list || [];
      const nextList = reset ? list : this.data.list.concat(list);
      this.setData({
        list: nextList,
        loading: false,
        finished: list.length < pageSize || page * pageSize >= res.total,
        page: page + 1,
      });
    } catch (err) {
      this.setData({ loading: false });
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
    }
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.init();
  },

  onClearFilter() {
    this.setData(
      {
        keyword: '',
        selectedCategory1Id: '',
        selectedCategory2Id: '',
        selectedCategory1Name: '',
        selectedCategory2Name: '',
        filteredCategory2List: [],
      },
      () => this.init()
    );
  },

  onShowCategory1Picker() {
    this.setData({ showCategory1Picker: true });
  },

  onCategory1PickerChange(e) {
    const { value } = e.detail;
    const selectedId = value[0];
    if (!selectedId) {
      this.setData(
        {
          selectedCategory1Id: '',
          selectedCategory1Name: '',
          selectedCategory2Id: '',
          selectedCategory2Name: '',
          filteredCategory2List: [],
          showCategory1Picker: false,
        },
        () => this.init()
      );
      return;
    }

    const selected = this.data.category1List.find(
      (item) => item.value === selectedId || item._id === selectedId
    );
    const category1Id = selected ? selected._id || selected.value : selectedId;
    const category1Name = selected ? selected.category1Name || selected.label || '' : '';
    const filteredCategory2List = [
      EMPTY_OPTION,
      ...filterCategory2ByCategory1(this.data.category2List, category1Id),
    ];

    this.setData(
      {
        selectedCategory1Id: category1Id,
        selectedCategory1Name: category1Name,
        selectedCategory2Id: '',
        selectedCategory2Name: '',
        filteredCategory2List,
        showCategory1Picker: false,
      },
      () => this.init()
    );
  },

  onCategory1PickerCancel() {
    this.setData({ showCategory1Picker: false });
  },

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
    if (!selectedId) {
      this.setData(
        {
          selectedCategory2Id: '',
          selectedCategory2Name: '',
          showCategory2Picker: false,
        },
        () => this.init()
      );
      return;
    }
    const selected = this.data.filteredCategory2List.find(
      (item) => item.value === selectedId || item._id === selectedId
    );
    const category2Id = selected ? selected._id || selected.value : selectedId;
    const category2Name = selected ? selected.category2Name || selected.label || '' : '';

    this.setData(
      {
        selectedCategory2Id: category2Id,
        selectedCategory2Name: category2Name,
        showCategory2Picker: false,
      },
      () => this.init()
    );
  },

  onCategory2PickerCancel() {
    this.setData({ showCategory2Picker: false });
  },

  openStockPopup(e) {
    const { spuIndex, skuIndex } = e.currentTarget.dataset;
    this.setData({
      stockPopupVisible: true,
      stockInput: '',
      currentSpuIndex: Number(spuIndex),
      currentSkuIndex: Number(skuIndex),
    });
  },

  closeStockPopup() {
    this.setData({
      stockPopupVisible: false,
      stockInput: '',
      currentSpuIndex: -1,
      currentSkuIndex: -1,
    });
  },

  onStockPopupVisibleChange(e) {
    const visible = !!e.detail.visible;
    if (!visible) {
      this.closeStockPopup();
    }
  },

  onStockInputChange(e) {
    this.setData({ stockInput: e.detail.value });
  },

  async confirmAddStock() {
    const { currentSpuIndex, currentSkuIndex, stockInput, list } = this.data;
    if (currentSpuIndex < 0 || currentSkuIndex < 0) {
      this.closeStockPopup();
      return;
    }

    const amount = Number(stockInput);
    if (!Number.isInteger(amount) || amount <= 0) {
      Toast({ context: this, selector: '#t-toast', message: '请输入大于0的整数' });
      return;
    }

    const spu = list[currentSpuIndex];
    const sku = spu && spu.skuList ? spu.skuList[currentSkuIndex] : null;
    if (!sku || !sku.skuId) {
      Toast({ context: this, selector: '#t-toast', message: 'SKU 信息缺失' });
      return;
    }

    try {
      await addSkuStock({ skuId: sku.skuId, amount });
      const nextList = list.slice();
      const nextSpu = { ...spu };
      const nextSkuList = (nextSpu.skuList || []).slice();
      const nextSku = { ...nextSkuList[currentSkuIndex] };
      nextSku.stock = Number(nextSku.stock || 0) + amount;
      nextSkuList[currentSkuIndex] = nextSku;
      nextSpu.skuList = nextSkuList;
      nextSpu.spuStockQuantity = Number(nextSpu.spuStockQuantity || 0) + amount;
      nextList[currentSpuIndex] = nextSpu;
      this.setData({ list: nextList });
      Toast({ context: this, selector: '#t-toast', message: '库存已更新' });
      this.closeStockPopup();
    } catch (err) {
      Toast({ context: this, selector: '#t-toast', message: err.message || '更新失败' });
    }
  },
});
