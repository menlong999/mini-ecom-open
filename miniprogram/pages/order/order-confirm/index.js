import Toast from 'tdesign-miniprogram/toast/index';
import { getDefaultAddress } from '../../../services/address/address';
import { addressPicker } from '../../../services/address/channel';
// import { saveOrder, deleteCartItems, checkStock, deductStock } from '../../../services/order/orderConfirm';
import { getPaymentParams } from '../../../services/order/payment';
import { createOrder } from '../../../services/order/createOrder';
import { fetchStoreList } from '../../../services/store/store';
import {
  INVOICE_TYPES,
  TITLE_TYPES,
  CONTENT_TYPES,
} from '../../../services/order/invoiceConstants';
import { runtimeConfig } from '../../../config/index';

Page({
  data: {
    loading: true,

    // 简化：直接使用商品列表，不分店铺
    goodsList: [],

    // 简化：订单汇总信息
    orderSummary: {
      totalGoodsCount: 0,
      totalSalePrice: 0,
      deliveryFee: 0,
      promotionAmount: 0,

      totalPayAmount: 0,
      invoiceSupport: true,
    },

    // 用户地址
    userAddress: null,

    // 1: 快递配送, 2: 门店自提
    deliveryType: 1,
    storeList: [],
    selectedStore: null,
    storePopupShow: false,
    pickupName: '',
    pickupPhone: '',
    pickupEnabled: runtimeConfig.features.pickup,

    // 优惠券相关

    // 发票信息
    invoiceData: {
      email: '',
      buyerTaxNo: '',
      invoiceType: INVOICE_TYPES.NONE,
      buyerPhone: '',
      buyerName: '',
      titleType: '',
      contentType: '',
    },
    invoiceDesc: '暂不开发票',

    // 订单备注（简化：全局单一备注）
    orderRemark: '',

    // UI 状态
    dialogShow: false,
    popupShow: false,
    canSubmit: true,

    // 弹窗位置
    notesPosition: 'center',
    placeholder: '备注信息',
  },

  // 页面生命周期
  async onLoad() {
    try {
      this.setData({ loading: true });
      await this.initOrderData();
      // 预加载门店列表
      if (this.data.pickupEnabled) {
        this.loadStoreList();
      }
    } catch (error) {
      console.error('页面初始化失败:', error);
      this.handleError();
    }
  },

  // 获取门店列表
  async loadStoreList() {
    const list = await fetchStoreList();
    this.setData({ storeList: list });
    if (list.length === 1) {
      this.setData({ selectedStore: list[0] });
    }

    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        pickupPhone: userInfo.phoneNumber || '',
        pickupName: userInfo.nickName || '',
      });
    }
  },

  onDeliveryTypeChange(e) {
    const nextDeliveryType = Number(e.detail.value);
    if (!this.data.pickupEnabled && nextDeliveryType === 2) {
      return;
    }
    this.setData({ deliveryType: nextDeliveryType });
    this.updateOrderSummary();
  },

  handleStoreCellClick() {
    this.setData({ storePopupShow: true });
  },

  closeStorePopup() {
    this.setData({ storePopupShow: false });
  },

  handleSelectStore(e) {
    const { index } = e.currentTarget.dataset;
    const store = this.data.storeList[index];
    this.setData({
      selectedStore: store,
      storePopupShow: false,
    });
  },

  handleContactName(e) {
    this.setData({ pickupName: e.detail.value });
  },

  handleContactPhone(e) {
    this.setData({ pickupPhone: e.detail.value });
  },

  onShow() {
    // 处理发票数据
    const invoiceData = wx.getStorageSync('invoiceData');
    if (invoiceData) {
      this.setData({
        invoiceData,
        invoiceDesc: this.getInvoiceDesc(invoiceData),
      });
      wx.removeStorageSync('invoiceData');
    }
  },

  // 初始化订单数据
  async initOrderData() {
    try {
      // 统一从 storage 获取结算列表
      const goodsListInCart = wx.getStorageSync('order.settleList');

      if (!goodsListInCart || goodsListInCart.length === 0) {
        throw new Error('商品列表为空');
      }

      // 数据清洗 - 关键步骤
      // 必须显式处理字段，避免 _id 冲突（购物车ID vs SPUID）
      const processedGoodsList = goodsListInCart.map((item) => {
        return {
          // item.spuId 就是来自 goods_spu._id
          spuId: item.spuId,
          skuId: item.skuId,
          title: item.title || item.goodsName || '',
          thumb: item.thumb || item.image || '',
          specs: (() => {
            if (Array.isArray(item.specs)) return item.specs.join('，');
            if (item.specs) return item.specs;
            if (Array.isArray(item.specInfo)) {
              return item.specInfo
                .map((s) => s.specValue || s.value)
                .filter((v) => v)
                .join('，');
            }
            return '';
          })(),
          price: item.price,
          quantity: item.quantity,
          specInfo: item.specInfo || [],
          cartId: item._id,
        };
      });

      // 先更新 data.goodsList，以便 computeOrderSummary 读取
      this.setData({ goodsList: processedGoodsList });

      // 计算并更新订单汇总
      this.updateOrderSummary();

      this.setData({
        loading: false,
      });

      // 获取用户地址
      await this.fetchUserAddress();
    } catch (error) {
      console.error('初始化订单数据失败:', error);
      this.handleError();
    }
  },

  // 统一计算订单金额
  computeOrderSummary() {
    const { goodsList } = this.data;
    const shippingConfig = runtimeConfig.order.shipping || {};
    const freeShippingThreshold = Number(shippingConfig.freeShippingThreshold) || 0;
    const defaultFee = Number(shippingConfig.defaultFee) || 0;

    // 1. 商品总价 & 总数
    const totalGoodsCount = goodsList.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalSalePrice = goodsList.reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      return sum + price * quantity;
    }, 0);

    // 2. 运费计算 (满99免运费)
    let deliveryFee = 0;
    if (this.data.deliveryType === 1) {
      // 只有快递配送才算运费
      deliveryFee = totalSalePrice >= freeShippingThreshold ? 0 : defaultFee;
    }

    // 3. 优惠计算

    const promotionAmount = 0; // 暂时无活动优惠
    // 4. 应付金额
    const totalPayAmount = totalSalePrice + deliveryFee - promotionAmount;

    return {
      totalGoodsCount,
      totalSalePrice: totalSalePrice.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      promotionAmount: promotionAmount.toFixed(2),

      totalPayAmount: Math.max(0, totalPayAmount).toFixed(2),
      invoiceSupport: true,
    };
  },

  // 更新订单汇总信息
  updateOrderSummary() {
    const orderSummary = this.computeOrderSummary();
    this.setData({ orderSummary });
  },

  // 获取用户地址
  async fetchUserAddress() {
    try {
      const openId = wx.getStorageSync('userInfo')?._openid;

      if (!openId) {
        console.warn('用户未登录或未获取到 openId');
        this.setData({ userAddress: {}, hasSelect: false });
        return;
      }

      // 先尝试获取选中的地址
      let userAddress = wx.getStorageSync('selectedAddress');

      // 如果没有选中地址，获取默认地址
      if (!userAddress) {
        userAddress = await getDefaultAddress(openId);
      }

      this.setData({ userAddress });
    } catch (error) {
      console.error('获取用户地址失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '获取地址失败',
        icon: 'error-circle',
      });
    }
  },

  // 跳转地址选择页面
  handleAddressClick() {
    addressPicker
      .getPromise()
      .then((address) => {
        this.setData({
          userAddress: address,
          hasSelect: true,
        });
        console.log('选中地址:', address);
      })
      .catch(() => {});

    const { userAddress } = this.data;
    let url = '/pages/usercenter/address/list/index?selectMode=1&isOrderSure=1';

    if (userAddress?.id) {
      url += `&id=${userAddress.id}`;
    }

    wx.navigateTo({
      url,
      fail: (error) => {
        console.error('跳转地址页面失败:', error);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '跳转失败，请重试',
        });
      },
    });
  },

  // 备注相关 - 简化为全局单一备注
  handleOpenNotes() {
    this.setData({
      dialogShow: true,
      notesPosition: 'center',
    });
  },

  handleNoteInput(e) {
    this.setData({
      orderRemark: e.detail.value,
    });
  },

  handleNoteFocus() {
    this.setData({
      notesPosition: 'self',
    });
  },

  handleNoteBlur() {
    this.setData({
      notesPosition: 'center',
    });
  },

  handleNoteConfirm() {
    this.setData({
      dialogShow: false,
    });
    Toast({
      context: this,
      selector: '#t-toast',
      message: '备注已保存',
    });
  },

  handleNoteCancel() {
    this.setData({
      dialogShow: false,
      orderRemark: this.data.orderRemark, // 恢复原值
    });
  },

  // 发票相关
  handleInvoiceClick() {
    const invoiceData = this.data.invoiceData || {};
    wx.navigateTo({
      url: `/pages/order/invoice/index?invoiceData=${JSON.stringify(invoiceData)}`,
    });
  },

  // 库存不足处理
  handleGoodsPopupConfirm() {
    this.setData({
      popupShow: false,
    });
  },

  handleGoodsPopupChange() {
    this.setData({
      popupShow: !this.data.popupShow,
    });
  },

  handleReturnToCart() {
    wx.switchTab({
      url: '/pages/cart/index',
    });
  },

  // 提交订单 (云函数事务版本 - 暂不启用)
  async handleSubmitOrderCloud() {
    try {
      const { goodsList, userAddress, orderSummary, orderRemark, invoiceData } = this.data;

      // 1. 校验
      if (!userAddress) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请选择收货地址',
          icon: 'error-circle',
        });
        return;
      }
      if (!this.data.canSubmit) return;

      this.setData({ canSubmit: false });
      // 2. 构造订单基础数据 (不含 goodsList，单独传)
      const { deliveryType, selectedStore, pickupName, pickupPhone } = this.data;

      // 校验逻辑
      if (deliveryType === 1 && !userAddress) {
        Toast({ context: this, selector: '#t-toast', message: '请选择收货地址' });
        this.setData({ canSubmit: true });
        return;
      }
      if (deliveryType === 2) {
        if (!selectedStore) {
          Toast({ context: this, selector: '#t-toast', message: '请选择自提门店' });
          this.setData({ canSubmit: true });
          return;
        }
        if (!pickupName || !pickupPhone) {
          Toast({ context: this, selector: '#t-toast', message: '请填写提货人信息' });
          this.setData({ canSubmit: true });
          return;
        }
        if (!/^1\d{10}$/.test(pickupPhone)) {
          Toast({ context: this, selector: '#t-toast', message: '手机号格式不正确' });
          this.setData({ canSubmit: true });
          return;
        }
      }

      const orderData = {
        deliveryType,
        // 如果是自提，传入自提信息结构: pickupStore
        ...(deliveryType === 2
          ? {
              pickupStore: {
                storeId: selectedStore._id,
                storeName: selectedStore.name,
                storeAddress: selectedStore.address,
                storeBusinessHours: selectedStore.businessHours,
                pickupName,
                pickupPhone,
              },
            }
          : {
              userAddress,
            }),

        orderSummary,
        orderRemark,
        invoiceData,
        // status, createTime 等由云函数处理或传递
      };
      // 3. 调用云函数 createOrder
      const result = await createOrder({
        goodsList,
        orderData,
      });

      const orderId = result.orderId;
      console.log('Cloud order created:', orderId);

      wx.hideLoading();

      // 4. 唤起支付 (复用现有支付逻辑)
      try {
        await this.executePay(orderSummary, orderId);
      } catch (payError) {
        this.handlePayError(payError, orderId);
      }
    } catch (error) {
      this.handleSubmitError(error);
    }
  },

  // 辅助方法：处理支付失败
  handlePayError(payError, orderId) {
    wx.hideLoading();
    console.error('支付失败:', payError);
    let errorMsg = '支付失败';
    if (payError.errMsg === 'requestPayment:fail cancel') {
      errorMsg = '您已取消支付';
    }
    Toast({
      context: this,
      selector: '#t-toast',
      message: errorMsg,
      icon: 'error-circle',
    });
    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/order/order-detail/index?orderId=${orderId}`,
      });
    }, 1500);
  },

  // 辅助方法：处理提交失败
  handleSubmitError(error) {
    wx.hideLoading();
    console.error('提交订单异常:', error);
    Toast({
      context: this,
      selector: '#t-toast',
      message: error.message || '提交失败，请重试',
      icon: 'error-circle',
    });
    this.setData({ canSubmit: true });
  },

  // 错误处理
  handleError() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '页面加载失败，请重试',
      icon: 'error-circle',
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 2000);

    this.setData({
      loading: false,
    });
  },

  async executePay(orderSummary, orderId) {
    wx.showLoading({ title: '正在拉起支付...' });
    // 5.1 获取支付参数 (金额为元，统一换算为分)
    const paymentParams = await getPaymentParams({
      orderId,
      amountYuan: orderSummary.totalPayAmount,
    });

    wx.hideLoading();

    // 5.2 唤起微信支付
    await wx.requestPayment({
      ...paymentParams,
    });

    // 6. 支付成功
    Toast({
      context: this,
      selector: '#t-toast',
      message: '支付成功',
      icon: 'check-circle',
    });

    // 跳转到支付结果页
    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/order/pay-result/index?orderId=${orderId}&totalPaid=${orderSummary.totalPayAmount}`,
      });
    }, 1000);
  },

  getInvoiceDesc(invoiceData) {
    if (!invoiceData || invoiceData.invoiceType === INVOICE_TYPES.NONE) {
      return '暂不开发票';
    }
    const title = invoiceData.titleType === TITLE_TYPES.COMPANY ? '公司' : '个人';
    const content =
      invoiceData.contentType === CONTENT_TYPES.GOODS_CATEGORY ? '商品类别' : '商品明细';
    return invoiceData.email ? `电子普通发票 (${content} - ${title})` : '暂不开发票';
  },
});
