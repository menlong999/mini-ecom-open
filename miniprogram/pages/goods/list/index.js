import { fetchGoodsList as fetchGoodsListService } from '../../../services/good/fetchGoodsList';
import { addCart } from '../../../services/cart/cart';
import { dispatchLogin } from '../../../services/common/login';
import Toast from 'tdesign-miniprogram/toast/index';
import Dialog from 'tdesign-miniprogram/dialog/index';

const SORT_FIELD = {
  OVERALL: 0,
  PRICE: 1,
};

const SORT_DIRECTION = {
  // 1: desc, 0: asc
  ASC: 'asc',
  DESC: 'desc',
};

const LOAD_STATUS = {
  MORE: 0,
  LOADING: 1,
  NO_MORE: 2,
};

const initFilters = {
  isOverallSort: true,
  priceSortDirection: '',
};

Page({
  data: {
    goodsList: [],
    filter: initFilters,
    hasLoaded: false,
    loadMoreStatus: LOAD_STATUS.MORE,
    loading: true,
    showFilterPopup: false,
    minVal: '',
    maxVal: '',
  },

  pageNum: 1,
  pageSize: 30,
  total: 0,
  categoryId: '',

  onLoad(options) {
    const { categoryId, categoryName } = options;
    console.log('onLoad:', options);
    this.categoryId = categoryId || '';
    if (categoryName) {
      wx.setNavigationBarTitle({ title: decodeURIComponent(categoryName) });
    }
    this.resetAndFetch();
  },

  onReachBottom() {
    const { goodsList } = this.data;
    if (goodsList.length >= this.total) {
      this.setData({ loadMoreStatus: LOAD_STATUS.NO_MORE });
      return;
    }
    this.fetchGoodsList(false);
  },

  // ========== 排序/筛选 ==========
  handleOverallSort() {
    this.setData({
      filter: { isOverallSort: true, priceSortDirection: '' },
    });
    this.resetAndFetch();
  },

  handlePriceSort() {
    const { filter } = this.data;
    // 逻辑优化：默认升序，如果当前是升序则切降序，否则（包括空和降序）切升序
    const nextSort =
      filter.priceSortDirection === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;

    this.setData({
      filter: { isOverallSort: false, priceSortDirection: nextSort },
    });
    this.resetAndFetch();
  },

  openFilterPopup() {
    this.setData({ showFilterPopup: true });
  },

  handleFilterPopupChange(e) {
    this.setData({ showFilterPopup: e.detail.visible });
  },

  handleMinPriceInput(e) {
    this.setData({ minVal: e.detail.value });
  },

  handleMaxPriceInput(e) {
    this.setData({ maxVal: e.detail.value });
  },

  handleFilterReset() {
    this.setData({ minVal: '', maxVal: '' });
  },

  handleFilterConfirm() {
    const { minVal, maxVal } = this.data;
    if (minVal && maxVal && Number(minVal) > Number(maxVal)) {
      Toast({ context: this, selector: '#t-toast', message: '请输入正确的价格范围' });
      return;
    }
    this.setData({ showFilterPopup: false });
    this.resetAndFetch();
  },

  resetAndFetch() {
    this.pageNum = 1;
    this.fetchGoodsList(true);
  },

  // ========== 数据加载 ==========
  getQueryParams(reset = false) {
    const { filter, minVal, maxVal } = this.data;
    const { priceSortDirection, isOverallSort } = filter;

    const params = {
      categoryId: this.categoryId,
      pageNum: reset ? 1 : this.pageNum + 1,
      pageSize: this.pageSize,
      minPrice: minVal ? Number(minVal) * 100 : 0,
      maxPrice: maxVal ? Number(maxVal) * 100 : undefined,
    };

    if (isOverallSort) {
      params.sortField = SORT_FIELD.OVERALL;
      params.sortDirection = SORT_DIRECTION.DESC; // 综合排序，默认降序
    } else {
      params.sortField = SORT_FIELD.PRICE;
      params.sortDirection = priceSortDirection || SORT_DIRECTION.ASC; // 默认为升序，虽然逻辑上不应为空
    }

    return params;
  },

  async fetchGoodsList(reset = true) {
    const { loadMoreStatus, goodsList = [] } = this.data;
    if (loadMoreStatus === LOAD_STATUS.LOADING) return; // 正在加载中

    this.setData({ loadMoreStatus: LOAD_STATUS.LOADING, loading: true });

    try {
      const params = this.getQueryParams(reset);
      const result = await fetchGoodsListService(params);
      const { spuList, totalCount = 0 } = result;

      if (totalCount === 0 && reset) {
        this.total = 0;
        this.setData({
          hasLoaded: true,
          loadMoreStatus: LOAD_STATUS.NO_MORE,
          loading: false,
          goodsList: [],
        });
        return;
      }

      const newGoodsList = reset ? spuList : goodsList.concat(spuList);
      const newLoadMoreStatus =
        newGoodsList.length >= totalCount ? LOAD_STATUS.NO_MORE : LOAD_STATUS.MORE;
      this.pageNum = params.pageNum;
      this.total = totalCount;

      this.setData({
        goodsList: newGoodsList,
        loadMoreStatus: newLoadMoreStatus,
        hasLoaded: true,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading goods list:', error);
      this.setData({ loading: false, loadMoreStatus: LOAD_STATUS.MORE });
    }
  },

  // ========== 商品点击 ==========
  navigateToGoodsDetail(e) {
    const { index } = e.currentTarget.dataset;
    const goods = this.data.goodsList[index];
    if (goods) {
      wx.navigateTo({
        url: `/pages/goods/details/index?spuId=${goods.spuId}`,
      });
    }
  },

  // ========== 加入购物车（带登录检测） ==========
  async handleAddCart(e) {
    const { index } = e.currentTarget.dataset;
    const goods = this.data.goodsList[index];

    if (!goods) {
      Toast({ context: this, selector: '#t-toast', message: '商品信息不存在' });
      return;
    }

    // 检查是否有默认 SKU
    if (!goods.defaultSku) {
      wx.navigateTo({ url: `/pages/goods/details/index?spuId=${goods.spuId}` });
      return;
    }

    // 检查库存
    if (!goods.hasStock || goods.defaultSku.stock <= 0) {
      Toast({ context: this, selector: '#t-toast', message: '商品已售罄' });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo._openid) {
      await this.performAddToCart(userInfo._openid, goods);
    } else {
      Dialog.confirm({
        title: '您尚未登录',
        content: '登录后即可将商品加入购物车',
        confirmBtn: '立即登录',
        cancelBtn: '暂不登录',
      })
        .then(() => this.handleLoginAndAddToCart(goods))
        .catch(() => {});
    }
  },

  async handleLoginAndAddToCart(goods) {
    wx.showLoading({ title: '正在登录...', mask: true });
    try {
      const userData = await dispatchLogin();
      if (userData) {
        wx.setStorageSync('userInfo', userData);
        wx.hideLoading();
        await this.performAddToCart(userData._openid, goods);
      } else {
        wx.hideLoading();
        Toast({ context: this, selector: '#t-toast', message: '登录失败，请重试' });
      }
    } catch (err) {
      wx.hideLoading();
      Toast({ context: this, selector: '#t-toast', message: `登录失败: ${err.errMsg || ''}` });
    }
  },

  async performAddToCart(openId, goods) {
    try {
      console.log('performAddToCart', openId, goods);
      const cartData = {
        spuId: goods.spuId,
        skuId: goods.defaultSku.skuId,
        title: goods.title,
        thumb: goods.thumb,
        price: goods.defaultSku.price || goods.price,
        quantity: 1,
        stockQuantity: goods.defaultSku.stock,
        specInfo: (goods.defaultSku.specValues || []).map((sv) => ({
          specId: sv.specId,
          specValueId: sv.specValueId,
          specTitle: sv.specTitle,
          specValue: sv.specValue,
        })),
        isSelected: true,
        valid: true,
      };
      await addCart(openId, cartData);
      Toast({ context: this, selector: '#t-toast', message: '已添加到购物车' });
    } catch (error) {
      console.error('添加购物车失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: `添加失败: ${error.message || '请重试'}`,
      });
    }
  },
});
