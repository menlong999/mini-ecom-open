import Toast from 'tdesign-miniprogram/toast/index';
import { fetchGood } from '../../../services/good/fetchGood';
import {
  getGoodsDetailsCommentsList,
  getGoodsDetailsCommentsCount,
} from '../../../services/good/fetchGoodsDetailsComments';
import { addCart } from '../../../services/cart/cart';
import { dispatchLogin } from '../../../services/common/login';

import Dialog from 'tdesign-miniprogram/dialog/index';

Page({
  data: {
    commentsList: [],
    commentsStatistics: {
      badCount: 0,
      commentCount: 0,
      goodCount: 0,
      goodRate: 0,
      hasImageCount: 0,
      middleCount: 0,
    },

    details: {},
    goodsTabArray: [
      { name: '商品', value: '' },
      { name: '详情', value: 'goods-page' },
    ],
    jumpArray: [
      { title: '首页', url: '/pages/home/home', iconName: 'home' },
      { title: '购物车', url: '/pages/cart/index', iconName: 'cart', showCartNum: true },
    ],
    isStock: true,
    cartNum: 0,
    soldout: false,
    buttonType: 1,
    navigation: true,
    buyNum: 1,
    selectedAttrStr: '',
    skuArray: [],
    primaryImage: '',
    specImg: '',
    isSpuSelectPopupShow: false,
    isAllSelectedSku: false,
    buyType: 0,
    selectItem: null,
    selectedSku: {},
    selectSkuSellsPrice: 0,
    minSalePrice: 0,
    maxSalePrice: 0,
    maxLinePrice: 0,
    spuId: '',
    soldNum: 0,
  },

  onLoad(query) {
    const { spuId } = query;
    this.setData({ spuId });
    this.fetchGoodsDetails(spuId);
    this.fetchCommentsList(spuId);
    this.fetchCommentsStatistics(spuId);
  },

  onPageScroll({ scrollTop }) {
    const goodsTab = this.selectComponent('#goodsTab');
    goodsTab && goodsTab.onScroll(scrollTop);
  },

  onShareAppMessage() {
    const { selectedAttrStr, details, spuId } = this.data;
    let shareSubTitle = '';
    if (selectedAttrStr.indexOf('件') > -1) {
      const count = selectedAttrStr.indexOf('件');
      shareSubTitle = selectedAttrStr.slice(count + 1);
    }
    return {
      imageUrl: details.primaryImage,
      title: details.title + shareSubTitle,
      path: `/pages/goods/details/index?spuId=${spuId}`,
    };
  },

  // 弹窗控制
  closeSpecPopup() {
    this.setData({ isSpuSelectPopupShow: false });
  },

  openSpecPopup(type) {
    this.setData({
      buyType: type || 0,
      isSpuSelectPopupShow: true,
    });
  },

  handleBuyItNow() {
    this.openSpecPopup(1);
  },

  handleAddCart() {
    this.openSpecPopup(2);
  },

  // 导航相关
  handleNav(e) {
    const { url } = e.detail;
    wx.switchTab({ url });
  },

  handlePreviewImage(e) {
    const { index } = e.detail;
    const { images } = this.data.details;
    wx.previewImage({
      current: images[index],
      urls: images,
    });
  },

  navigateToCommentsList() {
    wx.navigateTo({
      url: `/pages/goods/comments/index?spuId=${this.data.spuId}`,
    });
  },

  // 规格选择相关
  handleSpecSelect(e) {
    const { selectedSku, isAllSelectedSku } = e.detail;
    this.setData({ isAllSelectedSku });

    if (isAllSelectedSku) {
      this.updateSelectedSku(selectedSku);
    } else {
      this.clearSelection();
    }
  },

  updateSelectedSku(selectedSku) {
    const { skuArray, details } = this.data;
    const matchedSku = this.findMatchingSku(skuArray, selectedSku);

    if (matchedSku) {
      const specText = this.buildSpecText(details.specList, selectedSku);
      this.setData({
        selectItem: matchedSku,
        selectSkuSellsPrice: matchedSku.price || 0,
        specImg: matchedSku.skuImage || this.data.primaryImage,
        selectedAttrStr: specText,
        selectedSku,
      });
    }
  },

  clearSelection() {
    this.setData({
      selectItem: null,
      selectSkuSellsPrice: 0,
      selectedAttrStr: '',
    });
  },

  findMatchingSku(skuArray, selectedSku) {
    return skuArray.find((sku) =>
      (sku.specInfo || []).every((spec) => selectedSku[spec.specId] === spec.specValueId)
    );
  },

  buildSpecText(specList, selectedSku) {
    const specTexts = [];
    Object.keys(selectedSku).forEach((specId) => {
      const spec = specList.find((s) => s.specId === specId);
      if (spec) {
        const specValue = spec.specValueList.find((v) => v.specValueId === selectedSku[specId]);
        if (specValue) {
          specTexts.push(specValue.specValue);
        }
      }
    });
    return specTexts.length > 0 ? ` 件  ，${specTexts.join('  ，')}  ` : '';
  },

  // 购买相关
  handleQuantityChange(e) {
    this.setData({ buyNum: e.detail.buyNum });
  },

  handleSpecConfirm() {
    const { buyType } = this.data;
    if (buyType === 1) {
      this.handleBuyNowConfirm();
    } else {
      this.handleAddToCartConfirm();
    }
  },

  validateSelection() {
    const { isAllSelectedSku, selectItem, buyNum } = this.data;

    if (!isAllSelectedSku || !selectItem) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择规格',
        duration: 1000,
      });
      return false;
    }

    if (buyNum > selectItem.quantity) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: `库存不足，仅剩${selectItem.quantity}件`,
        duration: 1000,
      });
      return false;
    }

    return true;
  },

  /**
   * 加入购物车的主流程函数
   * 1. 校验规格是否选择完整
   * 2. 检查用户是否登录
   * 3. 如果已登录，直接执行加购
   * 4. 如果未登录，弹窗引导登录，成功后再执行加购
   */
  async handleAddToCartConfirm() {
    if (!this.validateSelection()) return;

    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo._openid) {
      // 已登录，直接执行添加购物车的核心逻辑
      await this._performAddToCart(userInfo._openid);
    } else {
      // 未登录，弹窗提示
      Dialog.confirm({
        title: '您尚未登录',
        content: '登录后即可将商品加入购物车',
        confirmBtn: '立即登录',
        cancelBtn: '暂不登录',
      })
        .then(() => {
          // 用户点击“立即登录”，执行登录并加购的流程
          this.executeLoginAndAddToCart();
        })
        .catch(() => {
          // 用户点击“暂不登录”或关闭弹窗
        });
    }
  },
  /**
   * 执行登录并自动加入购物车的函数
   */
  async executeLoginAndAddToCart() {
    wx.showLoading({ title: '正在登录...', mask: true });
    try {
      const userData = await dispatchLogin();
      if (userData) {
        wx.setStorageSync('userInfo', userData);
        wx.hideLoading();
        // 登录成功后，立即执行添加购物车的核心逻辑
        await this._performAddToCart(userData._openid);
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
   */
  async _performAddToCart(openId) {
    try {
      const goods = this.buildCartGoods();
      await addCart(openId, goods);
      Toast({ context: this, selector: '#t-toast', message: '已添加到购物车' });
      this.closeSpecPopup();
      // 可以在这里更新购物车的角标
      // this.getTabBar().init();
    } catch (error) {
      console.error('添加购物车失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: `添加失败: ${error.message || '请重试'}`,
      });
    }
  },

  buildCartGoods() {
    const { details, selectItem, buyNum, specImg, primaryImage, selectSkuSellsPrice } = this.data;

    if (!selectItem || !details) {
      throw new Error('商品信息不完整');
    }

    return {
      spuId: details.spuId,
      skuId: selectItem.skuId,
      title: details.title,
      thumb: specImg || primaryImage || details.primaryImage,
      specInfo: this.buildCartSpecInfo(),
      price: selectSkuSellsPrice || selectItem.price || details.minSalePrice || 0,
      quantity: parseInt(buyNum) || 1,
      stockQuantity: parseInt(selectItem.quantity) || 0,
      isSelected: true,
      valid: true,
    };
  },

  buildCartSpecInfo() {
    const { details, selectedSku } = this.data;
    const specInfo = [];

    Object.keys(selectedSku || {}).forEach((specId) => {
      const spec = details.specList.find((s) => s.specId === specId);
      if (spec) {
        const specValue = spec.specValueList.find((v) => v.specValueId === selectedSku[specId]);
        if (specValue) {
          specInfo.push({
            specId: specId,
            specValueId: selectedSku[specId],
            specTitle: spec.title,
            specValue: specValue.specValue,
          });
        }
      }
    });

    return specInfo;
  },

  handleBuyNowConfirm() {
    if (!this.validateSelection()) return;

    this.closeSpecPopup();
    const { buyNum, selectItem, details, spuId } = this.data;

    const specInfo = this.buildCartSpecInfo();
    const specs = specInfo.map((item) => item.specValue || item.value).filter((v) => v);

    const query = {
      quantity: parseInt(buyNum) || 1,
      spuId,
      skuId: selectItem.skuId,
      goodsName: details.title,
      price: selectItem.price,
      specInfo,
      specs,
      primaryImage: details.primaryImage,
      title: details.title,
      thumb: details.primaryImage,
    };
    // 统一使用 Storage 传递结算数据，避免 URL 长度限制
    wx.setStorageSync('order.settleList', [query]);

    wx.navigateTo({
      url: `/pages/order/order-confirm/index?type=buyNow`,
    });
  },

  // 数据获取
  fetchGoodsDetails(spuId) {
    fetchGood(spuId).then((details) => {
      const {
        skuList,
        primaryImage,
        isPutOnSale,
        minSalePrice,
        maxSalePrice,
        maxLinePrice,
        soldNum,
      } = details;

      const skuArray = skuList.map((item) => ({
        skuId: item.skuId,
        price: item.price,
        quantity: item.stockInfo ? item.stockInfo.stockQuantity : 0,
        specInfo: item.specInfo,
        skuImage: item.skuImage,
      }));

      this.setData({
        details,
        isStock: details.spuStockQuantity > 0,
        maxSalePrice: Number(maxSalePrice) || 0,
        maxLinePrice: Number(maxLinePrice) || 0,
        minSalePrice: Number(minSalePrice) || 0,
        skuArray,
        primaryImage,
        soldout: isPutOnSale === 0, // 0表示已下架
        soldNum,
      });
    });
  },

  async fetchCommentsList(spuId) {
    try {
      const data = await getGoodsDetailsCommentsList(spuId);
      const { homePageComments } = data;
      this.setData({
        commentsList: homePageComments.map((item) => ({
          goodsSpu: item.spuId,
          userName: item.userName || '',
          commentScore: item.commentScore,
          commentContent: item.commentContent || '用户未填写评价',
          userHeadUrl: item.isAnonymity ? '' : item.userHeadUrl || '',
          avatarText: (item.userName || '匿').slice(0, 1),
        })),
      });
    } catch (error) {
      console.error('comments error:', error);
    }
  },

  async fetchCommentsStatistics(spuId) {
    try {
      const data = await getGoodsDetailsCommentsCount(spuId);
      const { badCount, commentCount, goodCount, goodRate, hasImageCount, middleCount } = data;
      this.setData({
        commentsStatistics: {
          badCount: parseInt(badCount),
          commentCount: parseInt(commentCount),
          goodCount: parseInt(goodCount),
          goodRate: Math.floor(goodRate * 10) / 10,
          hasImageCount: parseInt(hasImageCount),
          middleCount: parseInt(middleCount),
        },
      });
    } catch (error) {
      console.error('comments statistics error:', error);
    }
  },
});
