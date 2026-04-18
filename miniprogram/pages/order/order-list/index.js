import { OrderStatus } from '../../../services/order/orderConfig';
import { fetchOrders, fetchOrdersCount } from '../../../services/order/orderList';
import { cancelOrder, deleteOrder } from '../../../services/order/orderDetail';
import { getPaymentParams } from '../../../services/order/payment';
import { cosThumb } from '../../../utils/util';
import { getOrderButtons, getOrderStatusDesc } from '../../../utils/orderHelper';
import Toast from 'tdesign-miniprogram/toast/index';

const ListLoadStatus = {
  IDLE: 0, // 0: 加载完成 / 空闲
  LOADING: 1, // 1: 正在加载中...
  LOADED_ALL: 2, // 2: 全部加载完成
  LOAD_FAILED: 3, // 3: 加载失败
};

const PageSize = 5;

Page({
  data: {
    pageIndex: 1,
    tabs: [
      { key: OrderStatus.ALL, text: '全部' },
      { key: OrderStatus.PENDING_PAYMENT, text: '待付款', info: '' }, // info 为订单数量
      { key: OrderStatus.PENDING_DELIVERY, text: '待发货', info: '' },
      { key: OrderStatus.PENDING_RECEIPT, text: '待收货', info: '' },
      { key: OrderStatus.COMPLETE, text: '已完成', info: '' },
    ],
    currentStatus: '',
    orderList: [],
    listLoading: ListLoadStatus.IDLE, // 使用常量进行初始化
    pullDownRefreshing: false,
    emptyImg: 'https://tdesign.gtimg.com/miniprogram/template/retail/order/empty-order-list.png',
    backRefresh: false,
  },

  onLoad(query) {
    let status = query.currentStatus || OrderStatus.ALL; // 兼容旧参数 status
    status = this.data.tabs.map((t) => t.key).includes(status) ? status : OrderStatus.ALL;
    this.init(status);
    this.pullDownRefresh = this.selectComponent('#pull-down-refresh');
  },

  onShow() {
    if (!this.data.backRefresh) return;
    this.handleRefresh();
    this.setData({ backRefresh: false });
  },

  onReachBottom() {
    // 使用常量进行判断
    if (this.data.listLoading === ListLoadStatus.IDLE) {
      this.fetchOrderList(this.data.currentStatus);
    }
  },

  onPageScroll(e) {
    this.pullDownRefresh &&
      this.pullDownRefresh.onPageScroll &&
      this.pullDownRefresh.onPageScroll(e);
  },

  handlePullDownRefresh(_e) {
    // const { callback } = e.detail;
    this.setData({ pullDownRefreshing: true });
    return this.reloadPageData(this.data.currentStatus)
      .then(() => {
        this.setData({ pullDownRefreshing: false });
        return Promise.resolve();
      })
      .catch((err) => {
        console.error('handlePullDownRefresh failed:', err);
        this.setData({ pullDownRefreshing: false });
        // 捕获错误后不再抛出，视为刷新动作结束（UI已复位）
        return Promise.resolve();
      });
  },

  init(status) {
    status = status !== undefined ? status : this.data.currentStatus;
    this.setData({
      currentStatus: status,
    });
    this.reloadPageData(status);
  },

  async fetchOrderList(orderStatus = OrderStatus.ALL, reset = false) {
    console.log('fetchOrderList start', orderStatus, reset);

    this.setData({ listLoading: ListLoadStatus.LOADING });
    try {
      const res = await fetchOrders({
        pageSize: PageSize,
        pageIndex: this.data.pageNumber,
        orderStatus: orderStatus,
      });
      console.log('getOrderList', res);

      const { nextList, isLastPage } = res;
      if (!nextList || nextList.length === 0) {
        // 如果没有订单数据，设置状态为已加载全部
        this.setData({
          listLoading: isLastPage ? ListLoadStatus.LOADED_ALL : ListLoadStatus.IDLE,
        });
        return Promise.resolve();
      } else {
        // 如果有订单数据，设置状态为空闲
        this.setData({
          listLoading: isLastPage ? ListLoadStatus.LOADED_ALL : ListLoadStatus.IDLE,
        });
        this.data.pageNumber++;

        const orderList = nextList.map((order) => {
          // 检查订单中是否有已经在售后的商品
          // 注意：如果只要有一个商品在售后，整个订单按钮可能就需要变化（或者针对单个商品？这里是订单维度的按钮）
          // 用户之前的逻辑是订单级按钮 "申请售后"。
          // 我们检查是否有任意商品有 afterServiceStatus
          const hasAfterService = (order.goodsList || []).some((g) => g.afterServiceStatus);
          const hasAfterServiceInProgress = (order.goodsList || []).some((g) => {
            const status = Number(g.afterServiceStatus);
            return [10, 20, 30, 40].includes(status);
          });

          return {
            orderId: order._id,
            orderNo: order.orderNo,
            status: order.status,
            statusDesc: getOrderStatusDesc(order.status, order.deliveryType),
            totalPayAmount: order.orderSummary.totalPayAmount, // 订单支付金额
            totalSalePrice: order.orderSummary.totalSalePrice, // 订单总金额
            createTime: order.createdAt,
            logistics: order.logistics || normalizeLogistics(order),
            goodsList: (order.goodsList || []).map((goods) => {
              return {
                id: goods.spuId,
                thumb: cosThumb(goods.thumb, 70),
                title: goods.title,
                skuId: goods.skuId,
                spuId: goods.spuId,
                specs: goods.specs,
                specInfo: goods.specInfo,
                price: goods.price,
                quantity: goods.quantity,
                // 透传售后信息，虽然目前order-list可能不直接用，但保持数据完整性
                afterServiceStatus: goods.afterServiceStatus,
                rightsNo: goods.rightsNo,
              };
            }),
            buttons:
              getOrderButtons(
                order.status,
                hasAfterService,
                order.isCommented,
                hasAfterServiceInProgress
              ) || [],
          };
        });

        if (reset) {
          this.setData({ orderList });
          return Promise.resolve();
        } else {
          this.setData({
            orderList: this.data.orderList.concat(orderList),
          });
          return Promise.resolve();
        }
      }
    } catch (err) {
      console.error('fetch order failed:', err);
      this.setData({ listLoading: ListLoadStatus.LOAD_FAILED });
      return Promise.reject(err);
    }
  },

  handleRetryLoad() {
    this.fetchOrderList(this.data.currentStatus);
  },

  handleTabChange(e) {
    const { value } = e.detail;
    this.setData({
      currentStatus: value,
    });
    this.reloadPageData(value);
  },

  async fetchOrderCounts() {
    const res = await fetchOrdersCount();
    const tabsCount = res.data || [];
    const { tabs } = this.data;
    tabs.forEach((tab) => {
      const tabCount = tabsCount.find((c) => c.orderStatus === tab.key);
      if (tabCount) {
        tab.info = tabCount.orderNum;
      }
    });
    this.setData({ tabs });
  },

  reloadPageData(status = OrderStatus.ALL) {
    this.data.pageNumber = 1; // 重置页码
    this.setData({ currentStatus: status, orderList: [] });
    return Promise.all([this.fetchOrderList(status, true), this.fetchOrderCounts()]);
  },

  handleRefresh() {
    this.reloadPageData(this.data.currentStatus);
  },

  handleOrderCardTap(e) {
    const { order } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/order-detail/index?orderId=${order.orderId}`,
    });
  },

  async handlePay(e) {
    const { order } = e.detail;
    console.log('handlePay', order);
    if (!order || !order.orderId) {
      Toast({ context: this, selector: '#t-toast', message: '订单信息错误' });
      return;
    }

    wx.showLoading({ title: '正在拉起支付...' });

    try {
      // 1. 获取支付参数
      const paymentParams = await getPaymentParams({
        orderId: order.orderId,
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
      this.handleRefresh();
    } catch (err) {
      wx.hideLoading();
      console.error('支付流程失败:', err);
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

  handleConfirmReceipt(e) {
    const { order } = e.detail;
    console.log('handleConfirmReceipt triggered', order);
    this.handleRefresh();
  },

  handleCancel(e) {
    const { order } = e.detail;
    console.log('handleCancel', order);

    // orderList 使用的是 orderId (映射到 _id)，但 API 需要原始对象结构
    // 构造一个符合 cancelOrder 期望的对象
    const orderData = {
      ...order,
      _id: order.orderId,
      status: order.status,
    };

    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelOrder(orderData);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '订单已取消',
            });
            this.handleRefresh();
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

  handleDelete(e) {
    const { order } = e.detail;
    console.log('handleDelete', order);
    const orderData = {
      ...order,
      _id: order.orderId,
    };

    wx.showModal({
      title: '删除订单',
      content: '确定要删除此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteOrder(orderData);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '订单已删除',
            });
            this.handleRefresh();
          } catch (e) {
            console.error('删除订单失败:', e);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '删除订单失败，请稍后再试',
              icon: 'error-circle',
            });
          }
        }
      },
    });
  },
});

function normalizeLogistics(order) {
  const logistics = {};
  if (order.logisticsNo) logistics.logisticsNo = order.logisticsNo;
  if (order.companyCode) logistics.companyCode = order.companyCode;
  if (order.companyName) logistics.companyName = order.companyName;
  if (order.remark) logistics.remark = order.remark;
  if (order.operator) logistics.operator = order.operator;
  if (order.openid) logistics.openid = order.openid;
  if (order.updatedAt) logistics.updatedAt = order.updatedAt;
  return logistics;
}
