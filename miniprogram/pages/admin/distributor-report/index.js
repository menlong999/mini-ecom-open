import Toast from 'tdesign-miniprogram/toast/index';
import { fetchDistributorOrders } from '../services/reportMgr';
import { fetchDistributorList } from '../services/distributorMgr';
import { formatTime } from '../../../utils/util';

Page({
  data: {
    distributorPopupVisible: false,
    distributorKeyword: '',
    distributorOptions: [],
    distributorLoading: false,
    selectedDistributor: null,
    distributorOrders: [],
    orderLoading: false,
    orderSummary: {
      totalCount: 0,
      totalAmount: 0,
    },
  },

  onPullDownRefresh() {
    if (this.data.selectedDistributor) {
      this.loadDistributorOrders(true);
    } else {
      wx.stopPullDownRefresh();
    }
  },

  openDistributorPopup() {
    if (this.data.distributorPopupVisible) return;
    this.setData({ distributorPopupVisible: true }, () => {
      if (!this.data.distributorOptions.length) {
        this.loadDistributorOptions();
      }
    });
  },

  closeDistributorPopup() {
    this.setData({ distributorPopupVisible: false });
  },

  onDistributorPopupChange(e) {
    const visible = !!e.detail.visible;
    if (!visible) {
      this.closeDistributorPopup();
    }
  },

  onDistributorKeywordChange(e) {
    this.setData({ distributorKeyword: e.detail.value });
  },

  async loadDistributorOptions() {
    if (this.data.distributorLoading) return;
    this.setData({ distributorLoading: true });
    try {
      const res = await fetchDistributorList({
        page: 1,
        pageSize: 50,
        status: 'APPROVED',
        keyword: this.data.distributorKeyword,
      });
      this.setData({ distributorOptions: res.list || [] });
    } catch (err) {
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
    } finally {
      this.setData({ distributorLoading: false });
    }
  },

  onSearchDistributor() {
    this.loadDistributorOptions();
  },

  selectDistributor(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || !item._openid) return;
    this.setData(
      {
        selectedDistributor: item,
        distributorPopupVisible: false,
      },
      () => this.loadDistributorOrders()
    );
  },

  async loadDistributorOrders(isRefresh = false) {
    const distributor = this.data.selectedDistributor;
    if (!distributor || !distributor._openid) return;
    if (this.data.orderLoading) return;
    this.setData({
      orderLoading: true,
      distributorOrders: [],
      orderSummary: { totalCount: 0, totalAmount: 0 },
    });
    try {
      const res = await fetchDistributorOrders({
        openid: distributor._openid,
        page: 1,
        pageSize: 50,
      });
      let totalAmount = 0;
      const list = (res.list || []).map((order) => {
        const deliveryType = Number(order.deliveryType) === 2 ? 2 : 1;
        const deliveryTypeText = deliveryType === 2 ? '门店自提' : '快递配送';
        const address = order.userAddress || {};
        const phone = address.phone || address.phoneNumber || '';
        const addressDetail = `${address.provinceName || ''}${address.cityName || ''}${
          address.districtName || ''
        }${address.detailAddress || ''}`;
        const amount = parseAmount(order.orderSummary && order.orderSummary.totalPayAmount);
        totalAmount += amount;
        const goodsList = (order.goodsList || []).map((goods) => ({
          title: goods.title || '',
          specsText: formatSpecs(goods),
          price: parseAmount(goods.price),
          quantity: goods.quantity || 0,
        }));

        return {
          ...order,
          deliveryType,
          deliveryTypeText,
          addressName: address.name || address.userName || '',
          addressPhoneMasked: maskPhone(phone),
          addressDetail,
          totalAmount: amount,
          goodsList,
          createdAtText: order.createdAt ? formatTime(order.createdAt, 'YYYY-MM-DD HH:mm') : '',
        };
      });
      this.setData({
        distributorOrders: list,
        orderSummary: {
          totalCount: list.length,
          totalAmount: totalAmount,
        },
      });
    } catch (err) {
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
    } finally {
      this.setData({ orderLoading: false });
      if (isRefresh) wx.stopPullDownRefresh();
    }
  },
});

function maskPhone(phone) {
  const value = String(phone || '');
  if (value.length < 7) return value;
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
}

function parseAmount(amount) {
  if (typeof amount === 'string') {
    return parseInt(amount, 10) || 0; // 假设数据已修正为分
  }
  return amount || 0;
}

function formatSpecs(goods) {
  if (!goods) return '-';
  if (Array.isArray(goods.specs)) {
    return goods.specs.join('，') || '-';
  }
  if (typeof goods.specs === 'string' && goods.specs) {
    return goods.specs;
  }
  if (Array.isArray(goods.specInfo)) {
    const text = goods.specInfo
      .map((item) => item.specValue || item.value)
      .filter(Boolean)
      .join('，');
    return text || '-';
  }
  return '-';
}
