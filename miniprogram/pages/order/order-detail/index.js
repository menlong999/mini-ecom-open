import { formatTime } from '../../../utils/util';
import { OrderStatus } from '../../../services/order/orderConfig';
import Toast from 'tdesign-miniprogram/toast/index';
import Dialog from 'tdesign-miniprogram/dialog/index';
import { fetchOrderDetail, cancelOrder, deleteOrder } from '../../../services/order/orderDetail';
import { getPaymentParams } from '../../../services/order/payment';
import { getOrderButtons, getOrderStatusDesc } from '../../../utils/orderHelper';
import {
  INVOICE_TYPES,
  TITLE_TYPES,
  CONTENT_TYPES,
} from '../../../services/order/invoiceConstants';
import { runtimeConfig } from '../../../config/index';

Page({
  data: {
    pageLoading: true,
    order: {}, // 订单原始数据
    orderNo: '', // 当前订单短ID
    formatedCreatedAt: '', // 格式化后的创建时间
    orderId: '', // 订单ID，_id
  },

  onLoad(query) {
    console.log('Order Detail Page Loaded with query:', query);
    const orderId = query.orderId || query._id;
    if (!orderId) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '订单ID缺失',
        icon: 'error-circle',
      });
      wx.navigateBack();
      return;
    }
    this.setData({ orderId });
    this.fetchDetail();
  },

  // 下拉刷新
  handlePullDownRefresh(e) {
    const { callback } = e.detail;
    this.fetchDetail().then(() => callback && callback());
  },

  async fetchDetail() {
    try {
      this.setData({ pageLoading: true });
      const order = await fetchOrderDetail(this.data.orderId);
      const hasAfterService = (order.goodsList || []).some((g) => g.afterServiceStatus);
      const hasAfterServiceInProgress = (order.goodsList || []).some((g) => {
        const status = Number(g.afterServiceStatus);
        return [10, 20, 30, 40].includes(status);
      });
      order.buttons = getOrderButtons(
        order.status,
        hasAfterService,
        order.isCommented,
        hasAfterServiceInProgress
      );
      order.orderId = order._id;
      this.setData({ orderStatusDesc: getOrderStatusDesc(order.status, order.deliveryType) });

      // 如果是待支付状态，计算并设置倒计时
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        const EXPIRE_DURATION = 60 * 60 * 1000; // 1 小时有效期
        const expireTime = order.createdAt + EXPIRE_DURATION;
        const remainingTime = expireTime - Date.now();
        console.log('Remaining time for countdown:', remainingTime);
        this.setData({ countdownTime: remainingTime > 0 ? remainingTime : 0 });
      } else {
        this.setData({ countdownTime: 0 }); // 其他状态不显示倒计时
      }

      // order.goodsList = order.goodsList.map((item) => {
      //   return {
      //     ...item,
      //     thumbHeight: parseInt(item.thumbHeight || 0, 10),
      //     thumbWidth: parseInt(item.thumbWidth || 0, 10),
      //   };
      // });
      console.log('Fetched order detail:', order);
      this.setData({
        order: order,
        pageLoading: false,
        formatedCreatedAt: formatTime(order.createdAt, 'YYYY-MM-DD HH:mm'),
        orderNo: order.orderNo || '', // 订单短ID，展示用
        invoiceDesc: this.getInvoiceDescSummary(order.invoiceData),
      });
    } catch (e) {
      console.error('获取订单详情失败:', e);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '订单加载失败',
        icon: 'error-circle',
      });
      this.setData({ pageLoading: false });
    }
  },

  getDetail() {
    return this.fetchDetail();
  },

  // 倒计时结束后触发
  handleCountdownFinish() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '订单已超时，自动取消',
    });
    this.fetchDetail(); // 重新获取详情，页面会显示“已取消”
  },

  // 跳转商品详情
  handleGoodsCardTap(e) {
    const { index } = e.currentTarget.dataset;
    const goods = this.data.order.goodsList[index];
    wx.navigateTo({ url: `/pages/goods/details/index?spuId=${goods.spuId}&skuId=${goods.skuId}` });
  },

  // 复制订单号
  handleOrderNumCopy() {
    wx.setClipboardData({
      data: this.data.orderNo || '',
    });
  },

  // 查看发票
  handleInvoiceView() {
    const invoice = this.data.order.invoiceData;
    if (!invoice || invoice.invoiceType === INVOICE_TYPES.NONE) {
      wx.showModal({
        title: '发票信息',
        content: '暂不开发票',
        showCancel: false,
      });
      return;
    }

    const { invoiceType, titleType, buyerName, buyerTaxNo, contentType, email } = invoice;

    const typeStr = invoiceType === INVOICE_TYPES.ELECTRONIC ? '电子普通发票' : '不开发票';
    const titleTypeStr = titleType === TITLE_TYPES.COMPANY ? '公司' : '个人';
    const contentStr = contentType === CONTENT_TYPES.GOODS_CATEGORY ? '商品类别' : '商品明细';

    const infoList = [
      `发票类型：${typeStr}`,
      `抬头类型：${titleTypeStr}`,
      `发票抬头：${buyerName || '-'}`,
    ];

    if (titleType === TITLE_TYPES.COMPANY) {
      infoList.push(`税号：${buyerTaxNo || '-'}`);
    }

    infoList.push(`发票内容：${contentStr}`);
    infoList.push(`电子邮箱：${email || '-'}`);

    Dialog.alert({
      context: this,
      selector: '#t-dialog',
      title: '发票信息',
      content: infoList.join('\n'),
      confirmBtn: '确认',
    });
  },

  getInvoiceDescSummary(invoiceData) {
    if (!invoiceData || invoiceData.invoiceType === INVOICE_TYPES.NONE) {
      return '暂不开发票';
    }
    const title = invoiceData.titleType === TITLE_TYPES.COMPANY ? '公司' : '个人';
    const content =
      invoiceData.contentType === CONTENT_TYPES.GOODS_CATEGORY ? '商品类别' : '商品明细';
    return `电子普通发票 (${content} - ${title})`;
  },

  // 联系客服
  handleContactService() {
    if (!runtimeConfig.customerService.phone) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '当前版本未配置客服电话',
        icon: 'error-circle',
      });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: runtimeConfig.customerService.phone,
    });
  },

  // 取消订单按钮
  handleCancelOrder(e) {
    console.log('取消订单按钮点击:', e);
    const order = this.data.order;
    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelOrder(order);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '订单已取消',
            });
            this.fetchDetail(); // 重新加载订单详情
          } catch (e) {
            console.error('取消订单失败:', e);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '取消订单失败，请稍后再试',
              icon: 'error-circle',
            });
          }
        }
      },
    });
  },
  // 删除订单按钮
  handleDeleteOrder(e) {
    console.log('删除订单按钮点击:', e);
    const order = this.data.order;
    wx.showModal({
      title: '删除订单',
      content: '确定要删除此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteOrder(order);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '订单已取消',
            });

            // 应该跳转到order-list 页面？
            wx.navigateTo({ url: '/pages/order/order-list/index' });
          } catch (e) {
            console.error('取消订单失败:', e);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '取消订单失败，请稍后再试',
              icon: 'error-circle',
            });
          }
        }
      },
    });
  },

  async handlePayOrder() {
    const { order } = this.data;
    if (!order || !order._id) {
      Toast({ context: this, selector: '#t-toast', message: '订单信息错误' });
      return;
    }

    wx.showLoading({ title: '正在拉起支付...' });

    try {
      // 1. 获取支付参数
      const paymentParams = await getPaymentParams({
        orderId: order._id,
        amountYuan: order.totalPayAmount,
      });
      console.log('成功获取支付参数:', paymentParams);

      wx.hideLoading();

      // 2. 调用 wx.requestPayment 唤起支付
      await wx.requestPayment({
        ...paymentParams,
      });

      // 3. 支付成功后的处理
      Toast({ context: this, selector: '#t-toast', message: '支付成功' });
      // 立即刷新订单详情，页面会显示为“待发货”
      this.fetchDetail();
    } catch (err) {
      wx.hideLoading();
      console.error('支付流程失败:', err);
      // 根据错误类型判断是用户取消还是API失败
      if (err.errMsg === 'requestPayment:fail cancel') {
        Toast({ context: this, selector: '#t-toast', message: '您已取消支付' });
      } else {
        Toast({
          context: this,
          selector: '#t-toast',
          message: `支付失败: ${err.message || '请稍后重试'}`,
          icon: 'error-circle',
        });
      }
    }
  },
});
