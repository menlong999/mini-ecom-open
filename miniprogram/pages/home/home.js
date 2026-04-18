import { fetchHome } from '../../services/home/home';
import { fetchGoodsListBySpuIds } from '../../services/good/fetchGoods';
import Toast from 'tdesign-miniprogram/toast/index';
import Dialog from 'tdesign-miniprogram/dialog/index'; // 1. 引入 Dialog
import { addCart } from '../../services/cart/cart'; // 2. 引入加入购物车的服务
import { dispatchLogin } from '../../services/common/login';

const GoodsListLoadStatus = {
  NONE: 0, // 未加载/初始
  LOADING: 1, // 加载中
  NO_MORE: 2, // 没有更多
  ERROR: 3, // 加载失败
};

Page({
  data: {
    imgSrcs: [],
    swiperList: [],
    tabList: [],
    goodsList: [],
    goodsListLoadStatus: GoodsListLoadStatus.NONE,
    pageLoading: false,
    current: 1,
    autoplay: true,
    duration: '500',
    interval: 5000,
    navigation: { type: 'dots' },
    swiperImageProps: { mode: 'aspectFill' },

    // 当前选中的 Tab 索引（方案B：Tab 直接配置 spuIds）
    selectedTabIndex: 0,
  },

  goodListPagination: {
    pageSize: 10,
  },

  privateData: {
    tabPageIndexMap: {}, // 每个 Tab 的当前页码（key=tabIndex）
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.fetchHomePageData();
  },

  onReachBottom() {
    if (this.data.goodsListLoadStatus === GoodsListLoadStatus.NONE) {
      this.fetchGoodsList(false);
    }
  },

  onPullDownRefresh() {
    this.fetchHomePageData();
  },

  async fetchHomePageData() {
    const that = this; // 保存 this 引用
    wx.stopPullDownRefresh();
    that.setData({ pageLoading: true });

    try {
      const { swiper, tabList } = await fetchHome();

      const defaultTabIndex = tabList && tabList.length > 0 ? 0 : 0;
      that.privateData.tabPageIndexMap = { [defaultTabIndex]: 1 };

      that.setData({
        tabList: tabList || [],
        swiperList: swiper || [],
        imgSrcs: (swiper || []).map((item) => (item && item.image) || ''),
        pageLoading: false,
        selectedTabIndex: defaultTabIndex,
      });

      that.fetchGoodsList(true);
    } catch (err) {
      console.error('loadHomePage error:', err);
      that.setData({ pageLoading: false });
    }
  },

  handleTabChange(e) {
    console.log('Tab changed:', e.detail);
    const tabIndex = e.detail && e.detail.value !== undefined ? Number(e.detail.value) : 0;

    if (this.data.selectedTabIndex === tabIndex) {
      return;
    }

    this.privateData.tabPageIndexMap[tabIndex] = 1;

    // ✅ 更新选中状态，触发 UI 更新
    this.setData({
      selectedTabIndex: tabIndex,
    });

    this.fetchGoodsList(true);
  },

  handleRetry() {
    this.fetchGoodsList();
  },

  async fetchGoodsList(fresh = false) {
    const that = this;
    if (fresh) {
      wx.pageScrollTo({ scrollTop: 0 });
    }
    that.setData({ goodsListLoadStatus: GoodsListLoadStatus.LOADING });
    const pageSize = this.goodListPagination.pageSize;
    const tabIndex = Number(this.data.selectedTabIndex) || 0;
    const tab = (this.data.tabList || [])[tabIndex];
    const spuIds = tab && Array.isArray(tab.spuIds) ? tab.spuIds : [];

    // 获取当前 Tab 的页码
    let pageIndex = this.privateData.tabPageIndexMap[tabIndex] || 1;
    if (fresh) {
      pageIndex = 1;
    }

    if (!spuIds.length) {
      that.setData({
        goodsList: [],
        goodsListLoadStatus: GoodsListLoadStatus.NO_MORE,
      });
      this.privateData.tabPageIndexMap[tabIndex] = 1;
      return;
    }
    try {
      const { nextList, isLastPage } = await fetchGoodsListBySpuIds(spuIds, pageIndex, pageSize);
      that.setData({
        goodsList: fresh ? nextList : that.data.goodsList.concat(nextList),
        goodsListLoadStatus: isLastPage ? GoodsListLoadStatus.NO_MORE : GoodsListLoadStatus.NONE,
      });
      // 只有在不是fresh时才自增页码
      that.privateData.tabPageIndexMap[tabIndex] = fresh ? 2 : pageIndex + 1;
    } catch (err) {
      console.error('Error loading goods list:', err);
      that.setData({ goodsListLoadStatus: GoodsListLoadStatus.ERROR });
    }
  },

  navigateToGoodsDetail(e) {
    const { index } = e.currentTarget.dataset;
    const goods = this.data.goodsList[index];
    if (goods && goods.spuId) {
      wx.navigateTo({
        url: `/pages/goods/details/index?spuId=${goods.spuId}`,
      });
    }
  },

  /**
   * 首页商品列表“加入购物车”按钮点击事件
   */
  async handleAddCart(e) {
    const { index } = e.currentTarget.dataset;
    const goods = this.data.goodsList[index];

    if (!goods) {
      Toast({ context: this, selector: '#t-toast', message: '商品信息不存在' });
      return;
    }

    // 检查是否有默认 SKU
    if (!goods.defaultSku) {
      // 没有默认 SKU，跳转详情页选择规格
      wx.navigateTo({
        url: `/pages/goods/details/index?spuId=${goods.spuId}`,
      });
      return;
    }

    // 检查库存
    if (!goods.hasStock || goods.defaultSku.stock <= 0) {
      Toast({ context: this, selector: '#t-toast', message: '商品已售罄' });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo._openid) {
      // 场景一：用户已登录，直接执行加购
      await this.performAddToCart(userInfo._openid, goods);
    } else {
      // 场景二：用户未登录，弹窗引导
      Dialog.confirm({
        title: '您尚未登录',
        content: '登录后即可将商品加入购物车',
        confirmBtn: '立即登录',
        cancelBtn: '暂不登录',
      })
        .then(() => {
          // 用户点击“立即登录”，执行登录并加购的流程
          this.handleLoginAndAddToCart(goods);
        })
        .catch(() => {
          // 用户点击“暂不登录”或关闭弹窗，不执行任何操作
        });
    }
  },

  /**
   * 封装的、执行登录并自动加入购物车的函数
   * @param {Object} goods 要加入购物车的商品信息
   */
  async handleLoginAndAddToCart(goods) {
    wx.showLoading({ title: '正在登录...', mask: true });
    try {
      const userData = await dispatchLogin();
      if (userData) {
        wx.setStorageSync('userInfo', userData);
        wx.hideLoading();
        // 登录成功后，立即执行添加购物车的核心逻辑
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

  /**
   * 封装的、实际执行“添加购物车”操作的核心函数
   * @param {string} openId 用户的 openId
   * @param {Object} goods 商品信息（含 defaultSku）
   */
  async performAddToCart(openId, goods) {
    try {
      // 构建购物车数据，使用默认 SKU 信息
      const specValues = goods.defaultSku.specValues || [];

      // 构建 specInfo，包含规格值文本
      // specValues 中应该有 specTitle 和 specValue（如果没有则为空）
      const specInfo = specValues.map((sv) => ({
        specId: sv.specId || '',
        specValueId: sv.specValueId || sv.valueId || '',
        specTitle: sv.specTitle || '', // 规格名称（如"颜色"）
        specValue: sv.specValue || sv.value || '', // 规格值（如"红色"）
      }));

      const cartData = {
        spuId: goods.spuId,
        skuId: goods.defaultSku.skuId,
        title: goods.title,
        thumb: goods.primaryImage,
        price: goods.defaultSku.price || goods.minSalePrice,
        quantity: 1,
        stockQuantity: goods.defaultSku.stock,
        specInfo,
        isSelected: true,
        valid: true,
      };

      await addCart(openId, cartData);
      Toast({ context: this, selector: '#t-toast', message: '已添加到购物车' });
      // 更新购物车角标
      this.getTabBar().init();
    } catch (error) {
      console.error('添加购物车失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: `添加失败: ${error.message || '请重试'}`,
      });
    }
  },

  navigateToActivityDetail({ detail }) {
    const idx = detail && detail.index !== undefined ? Number(detail.index) : 0;
    const item = (this.data.swiperList || [])[idx];
    const linkType = (item && item.linkType) || 'spu';
    if (linkType === 'poi') {
      const poi = item && item.poi;
      const lat = poi ? Number(poi.latitude) : NaN;
      const lng = poi ? Number(poi.longitude) : NaN;
      if (!poi || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
      wx.openLocation({
        latitude: lat,
        longitude: lng,
        name: poi.name || '',
        address: poi.address || '',
      });
      return;
    }
    const spuId = item && item.spuId;
    if (!spuId) return;
    wx.navigateTo({ url: `/pages/goods/details/index?spuId=${spuId}` });
  },
});
