import Dialog from 'tdesign-miniprogram/dialog/index';
import Toast from 'tdesign-miniprogram/toast/index';
import {
  fetchCartList,
  addCart,
  selectGoods,
  selectAllGoods,
  changeQuantity,
  deleteGoods,
  clearInvalidGoods,
} from '../../services/cart/cart';

Page({
  data: {
    cartList: [],
    invalidList: [],
    isAllSelected: false,
    totalAmount: 0,
    selectedGoodsCount: 0,
    isLogin: false,
  },

  openId: '',

  async onShow() {
    this.getTabBar().init();
    this.loadCartData();
  },

  async onLoad() {
    await this.fetchCartData();
  },

  /**
   * 检查登录状态并拉取数据
   * loadCartData
   */
  async loadCartData() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo._openid) {
      // 状态一：用户已登录
      this.setData({ isLogin: true });
      this.openId = userInfo._openid;
      console.log('Cart openId: ', this.openId);
      await this.fetchCartData();
    } else {
      // 状态二：用户未登录
      this.setData({
        isLogin: false,
        cartList: [],
        invalidList: [],
        isAllSelected: false,
        totalAmount: 0,
        selectedGoodsCount: 0,
      });
      Dialog.confirm({
        title: '您尚未登录',
        content: '登录后即可查看您的购物车商品',
        confirmBtn: '去登录',
        cancelBtn: '再逛逛',
      })
        .then(() => {
          // 用户点击“去登录”，跳转到个人中心页
          this.navigateToLogin();
        })
        .catch(() => {
          // 用户点击“再逛逛”，停留在当前页面
          // 可以选择跳转到首页
          this.navigateToHome();
        });
    }
  },

  // 拉取购物车数据
  async fetchCartData() {
    try {
      const allList = await fetchCartList(this.openId);
      let cartList = allList.filter((item) => item.valid !== false);
      const invalidList = allList.filter((item) => item.valid === false);

      cartList = cartList.map((goods) => ({
        ...goods,
        // 转换为字符串数组，过滤掉 null/undefined
        specs: (goods.specInfo || [])
          .map((item) => item.specValue || item.value || '')
          .filter((v) => v),
      }));

      // 计算总金额和选中商品数量
      const selectedGoods = cartList.filter((item) => item.isSelected);
      const totalAmount = selectedGoods.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const selectedGoodsCount = selectedGoods.reduce((sum, item) => sum + item.quantity, 0);

      this.setData({
        cartList,
        invalidList,
        isAllSelected: cartList.length > 0 && cartList.every((i) => i.isSelected),
        totalAmount,
        selectedGoodsCount,
      });
    } catch (error) {
      console.error('获取购物车数据失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '获取购物车数据失败，请重试',
      });
    }
  },

  // 单个商品选择
  async handleGoodsSelect(e) {
    try {
      // 注意：这里 data-goods 绑定的是整个 item，或者需要 dataset.spuId 等
      // 之前的组件可能是 event.detail.goods
      // 原生绑定通常是 e.currentTarget.dataset.goods
      const goods = e.currentTarget.dataset.goods;
      const isSelected = !goods.isSelected; // 切换状态

      await selectGoods(this.openId, goods.spuId, goods.skuId, isSelected);
      await this.fetchCartData();
    } catch (error) {
      console.error('选择商品失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '操作失败，请重试',
      });
    }
  },

  // 全选/取消全选
  async handleSelectAll() {
    try {
      const isAllSelected = !this.data.isAllSelected;

      await selectAllGoods(this.openId, isAllSelected);
      await this.fetchCartData();
    } catch (error) {
      console.error('全选操作失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '操作失败，请重试',
      });
    }
  },

  // 数量变更
  async handleQuantityChange(e) {
    try {
      const quantity = e.detail.value;
      const goods = e.currentTarget.dataset.goods;

      // 数量验证
      if (!quantity || quantity < 1) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '商品数量不能小于1',
        });
        return;
      }

      if (quantity > 999) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '商品数量不能超过999',
        });
        return;
      }

      await changeQuantity(this.openId, goods.spuId, goods.skuId, quantity);
      await this.fetchCartData();
    } catch (error) {
      console.error('修改数量失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '修改数量失败，请重试',
      });
    }
  },

  // 删除商品
  async handleDeleteConfirm(e) {
    try {
      const goods = e.currentTarget.dataset.goods;

      const confirmResult = await Dialog.confirm({
        content: '确认删除该商品吗?',
        confirmBtn: '确定',
        cancelBtn: '取消',
      });

      await deleteGoods(this.openId, goods.spuId, goods.skuId);
      await this.fetchCartData();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '商品删除成功',
      });
    } catch (error) {
      if (error?.errMsg?.includes('cancel')) {
        // 用户取消操作，不显示错误
        return;
      }
      console.error('删除商品失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '删除失败，请重试',
      });
    }
  },

  // 清空失效商品
  async handleClearInvalid() {
    try {
      if (this.data.invalidList.length === 0) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '暂无失效商品',
        });
        return;
      }

      const confirmResult = await Dialog.confirm({
        content: '确认清空所有失效商品吗?',
        confirmBtn: '确定',
        cancelBtn: '取消',
      });

      await clearInvalidGoods(this.openId);
      await this.fetchCartData();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '已清空失效商品',
      });
    } catch (error) {
      if (error?.errMsg?.includes('cancel')) {
        // 用户取消操作，不显示错误
        return;
      }
      console.error('清空失效商品失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '清空失败，请重试',
      });
    }
  },

  // 结算跳转
  navigateToOrderConfirm() {
    try {
      const goodsRequestListInCart = this.data.cartList.filter((item) => item.isSelected);

      if (goodsRequestListInCart.length === 0) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请先选择商品',
        });
        return;
      }

      // 验证商品数据完整性
      const invalidGoods = goodsRequestListInCart.find(
        (item) => !item.spuId || !item.skuId || !item.title || item.price <= 0 || item.quantity <= 0
      );

      if (invalidGoods) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '商品信息异常，请刷新后重试',
        });
        return;
      }

      wx.setStorageSync('order.settleList', goodsRequestListInCart);
      wx.navigateTo({
        url: '/pages/order/order-confirm/index?type=cart',
        fail: (error) => {
          console.error('跳转结算页面失败:', error);
          Toast({
            context: this,
            selector: '#t-toast',
            message: '跳转失败，请重试',
          });
        },
      });
    } catch (error) {
      console.error('结算失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '结算失败，请重试',
      });
    }
  },

  // 跳转商品详情
  navigateToGoodsDetails(e) {
    try {
      // 支持直接传参或通过 Event 获取
      let spuId;
      if (e && e.currentTarget) {
        spuId = e.currentTarget.dataset.goods?.spuId;
      } else if (typeof e === 'string') {
        spuId = e;
      }

      if (!spuId) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '商品信息异常',
        });
        return;
      }

      wx.navigateTo({
        url: `/pages/goods/details/index?spuId=${spuId}`,
        fail: (error) => {
          console.error('跳转商品详情失败:', error);
          Toast({
            context: this,
            selector: '#t-toast',
            message: '跳转失败，请重试',
          });
        },
      });
    } catch (error) {
      console.error('跳转商品详情失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '跳转失败，请重试',
      });
    }
  },

  // 跳转首页
  navigateToHome() {
    wx.switchTab({
      url: '/pages/home/home',
    });
  },

  // 跳转登录页
  navigateToLogin() {
    wx.switchTab({
      url: '/pages/usercenter/index',
    });
  },
});
