import { fetchAdminOrders } from '../../../../services/admin/orderMgr';
import { getOrderStatusDesc } from '../../../../utils/orderHelper';
import { formatTime } from '../../../../utils/util';
import Toast from 'tdesign-miniprogram/toast/index';

const STATUS_TABS = [
  { key: 'ALL', text: '全部' },
  { key: 'PENDING_DELIVERY', text: '待发货' },
  { key: 'PENDING_RECEIPT', text: '待收货' },
];

const formatOperatorTime = (timestamp) => {
  if (!timestamp) return '';
  return formatTime(timestamp, 'YYYY-MM-DD HH:mm');
};

Page({
  data: {
    statusTabs: STATUS_TABS,
    currentStatus: 'ALL',
    keyword: '',
    orderList: [],
    loading: false,
    finished: false,
    page: 1,
    pageSize: 20,
    backRefresh: false,
  },

  onLoad() {
    this.init();
  },

  onShow() {
    if (!this.data.backRefresh) return;
    this.setData({ backRefresh: false }, () => this.refresh());
  },

  onPullDownRefresh() {
    this.refresh();
  },

  onReachBottom() {
    if (this.data.loading || this.data.finished) return;
    this.loadOrders(false);
  },

  init() {
    this.setData({
      orderList: [],
      page: 1,
      finished: false,
      loading: true,
    });
    this.loadOrders(true);
  },

  async refresh() {
    this.setData({
      orderList: [],
      page: 1,
      finished: false,
    });
    try {
      await this.loadOrders(true);
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  async loadOrders(reset) {
    const { page, pageSize, currentStatus, keyword } = this.data;
    try {
      this.setData({ loading: true });
      const res = await fetchAdminOrders({
        page,
        pageSize,
        status: currentStatus,
        keyword,
      });
      const { list, total } = res;

      const mapped = (list || []).map((order) => {
        const goodsList = order.goodsList || [];
        const goodsCount = goodsList.length;
        const firstTitle = goodsCount > 0 ? goodsList[0].title : '';
        const goodsBrief =
          goodsCount > 1 ? `${firstTitle} 等${goodsCount}件` : firstTitle || '无商品';
        const totalPayAmount = order.orderSummary ? order.orderSummary.totalPayAmount : '';
        const totalSalePrice = order.orderSummary ? order.orderSummary.totalSalePrice : '';
        const deliveryFee = order.orderSummary ? order.orderSummary.deliveryFee : '';
        const deliveryTypeText = Number(order.deliveryType) === 2 ? '门店自提' : '快递配送';
        const isPickup = Number(order.deliveryType) === 2;
        const logistics = order.logistics || {};
        const operatorName = logistics.operator || '';
        const operatorTime = formatOperatorTime(logistics.updatedAt);
        let actionText = '';
        let actionDisabled = false;
        let actionMode = 'ship';

        if (isPickup) {
          if (order.status === 'PENDING_DELIVERY') {
            actionText = '确认提货';
            actionMode = 'pickup';
          } else {
            actionText = '已提货';
            actionDisabled = true;
          }
        } else if (order.status === 'PENDING_DELIVERY') {
          actionText = '发货';
          actionMode = 'ship';
        } else {
          actionText = '修改物流';
          actionMode = 'update';
        }

        return {
          ...order,
          goodsBrief,
          totalPayAmount,
          totalSalePrice,
          deliveryFee,
          deliveryTypeText,
          statusDesc: getOrderStatusDesc(order.status, order.deliveryType),
          logistics,
          operatorName,
          operatorTime,
          actionText,
          actionDisabled,
          actionMode,
        };
      });

      const nextList = reset ? mapped : this.data.orderList.concat(mapped);
      this.setData({
        orderList: nextList,
        loading: false,
        finished: mapped.length < pageSize || pageSize * page >= total,
        page: page + 1,
      });
    } catch (err) {
      console.error(err);
      this.setData({ loading: false });
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
    }
  },

  onStatusTabTap(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ currentStatus: key }, () => this.init());
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.init();
  },

  onShipTap(e) {
    const { id, mode } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/order/ship/index?orderId=${id}&mode=${mode}` });
  },
});
