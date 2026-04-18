import Toast from 'tdesign-miniprogram/toast/index';
import { fetchReportOverview } from '../../../services/admin/reportMgr';

const DEFAULT_SUMMARY = {
  day: { orderCount: 0, salesAmount: '0.00' },
  week: { orderCount: 0, salesAmount: '0.00' },
  month: { orderCount: 0, salesAmount: '0.00' },
};

Page({
  data: {
    loading: false,
    summary: DEFAULT_SUMMARY,
    dayRows: [],
    monthRows: [],
  },

  onLoad() {
    this.loadReport();
  },

  onPullDownRefresh() {
    this.loadReport(true);
  },

  async loadReport(isRefresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const data = await fetchReportOverview();
      this.setData({
        summary: data.summary || DEFAULT_SUMMARY,
        dayRows: data.dayRows || [],
        monthRows: data.monthRows || [],
      });
    } catch (err) {
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
    } finally {
      this.setData({ loading: false });
      if (isRefresh) wx.stopPullDownRefresh();
    }
  },
});
