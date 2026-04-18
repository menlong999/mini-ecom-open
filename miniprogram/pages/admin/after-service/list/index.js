import { fetchAdminAfterServices } from '../../../../services/admin/afterServiceMgr';
import { ServiceTypeDesc } from '../../../../services/order/orderConfig';
import { formatTime } from '../../../../utils/util';
import Toast from 'tdesign-miniprogram/toast/index';

const STATUS_TABS = [
  { key: 'ALL', text: '全部' },
  { key: 10, text: '待审核' },
  { key: 20, text: '已审核' },
  { key: 30, text: '已收货' },
  { key: 40, text: '收货异常' },
  { key: 50, text: '已完成' },
  { key: 60, text: '已关闭' },
  { key: 70, text: '退款异常' },
];

const STATUS_MAP = {
  10: '待审核',
  20: '已审核',
  30: '已收货',
  40: '收货异常',
  50: '已完成',
  60: '已关闭',
  70: '退款异常',
};

const formatSpecs = (goods) => {
  if (!goods) return '-';
  if (Array.isArray(goods.specs)) return goods.specs.join(' / ');
  if (typeof goods.specs === 'string' && goods.specs) return goods.specs;
  if (Array.isArray(goods.specInfo)) {
    return goods.specInfo
      .map((s) => s.specValue || '')
      .filter(Boolean)
      .join(' / ');
  }
  return '-';
};

Page({
  data: {
    statusTabs: STATUS_TABS,
    currentStatus: 'ALL',
    keyword: '',
    serviceList: [],
    loading: false,
    finished: false,
    page: 1,
    pageSize: 20,
  },

  onLoad() {
    this.init();
  },

  onPullDownRefresh() {
    this.refresh();
  },

  onReachBottom() {
    if (this.data.loading || this.data.finished) return;
    this.loadServices(false);
  },

  init() {
    this.setData({
      serviceList: [],
      page: 1,
      finished: false,
      loading: true,
    });
    this.loadServices(true);
  },

  async refresh() {
    this.setData({
      serviceList: [],
      page: 1,
      finished: false,
    });
    try {
      await this.loadServices(true);
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  async loadServices(reset) {
    const { page, pageSize, currentStatus, keyword } = this.data;
    try {
      this.setData({ loading: true });
      const res = await fetchAdminAfterServices({
        page,
        pageSize,
        status: currentStatus,
        keyword,
      });
      const { list, total } = res;

      const mapped = (list || []).map((service) => {
        const rawGoodsList = Array.isArray(service.goods)
          ? service.goods
          : service.goods
          ? [service.goods]
          : [];
        const goodsList = rawGoodsList.map((goods) => ({
          title: goods.title || '',
          specs: formatSpecs(goods),
          price: goods.price || 0,
          quantity: goods.refundQuantity || goods.quantity || 0,
        }));
        const statusDesc = STATUS_MAP[service.status] || '处理中';
        const typeDesc = ServiceTypeDesc[service.type] || '售后';
        const createdAtText = service.createdAt
          ? formatTime(service.createdAt, 'YYYY-MM-DD HH:mm')
          : '';
        const actionText = [50, 60].includes(Number(service.status)) ? '查看' : '处理';

        return {
          ...service,
          goodsList,
          statusDesc,
          typeDesc,
          createdAtText,
          actionText,
        };
      });

      const nextList = reset ? mapped : this.data.serviceList.concat(mapped);
      this.setData({
        serviceList: nextList,
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

  onDetailTap(e) {
    const { rightsno } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/admin/after-service/detail/index?rightsNo=${rightsno}` });
  },
});
