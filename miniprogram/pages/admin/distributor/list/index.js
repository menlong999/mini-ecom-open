import Toast from 'tdesign-miniprogram/toast/index';
import {
  fetchDistributorList,
  approveDistributor,
  rejectDistributor,
} from '../../../../services/admin/distributorMgr';
import { formatTime } from '../../../../utils/util';

const STATUS_TABS = [
  { key: 'ALL', text: '全部' },
  { key: 'PENDING', text: '待审核' },
  { key: 'APPROVED', text: '已通过' },
  { key: 'REJECTED', text: '已拒绝' },
];

const STATUS_MAP = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
};

Page({
  data: {
    statusTabs: STATUS_TABS,
    currentStatus: 'PENDING',
    keyword: '',
    list: [],
    loading: false,
    finished: false,
    page: 1,
    pageSize: 20,
    rejectVisible: false,
    rejectReason: '',
    rejectOpenid: '',
    actionLoading: false,
  },

  onLoad() {
    this.init();
  },

  onPullDownRefresh() {
    this.refresh();
  },

  onReachBottom() {
    if (this.data.loading || this.data.finished) return;
    this.loadList(false);
  },

  init() {
    this.setData({
      list: [],
      page: 1,
      finished: false,
      loading: true,
    });
    this.loadList(true);
  },

  async refresh() {
    this.setData({
      list: [],
      page: 1,
      finished: false,
    });
    try {
      await this.loadList(true);
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  async loadList(reset) {
    const { page, pageSize, currentStatus, keyword } = this.data;
    try {
      this.setData({ loading: true });
      const res = await fetchDistributorList({
        page,
        pageSize,
        status: currentStatus,
        keyword,
      });
      const { list, total } = res;
      const mapped = (list || []).map((item) => {
        const statusDesc = STATUS_MAP[item.distributorStatus] || '未知状态';
        const applyAtText = item.distributorApplyAt
          ? formatTime(item.distributorApplyAt, 'YYYY-MM-DD HH:mm')
          : '-';
        return {
          ...item,
          statusDesc,
          applyAtText,
          rejectReason: item.distributorRejectReason || '',
          canApprove: item.distributorStatus === 'PENDING',
        };
      });

      const nextList = reset ? mapped : this.data.list.concat(mapped);
      this.setData({
        list: nextList,
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

  onStatusTabChange(e) {
    const { value } = e.detail;
    this.setData({ currentStatus: value }, () => this.init());
  },

  onKeywordChange(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.init();
  },

  async handleApprove(e) {
    const openid = e.currentTarget.dataset.openid;
    if (!openid || this.data.actionLoading) return;

    wx.showModal({
      title: '确认通过',
      content: '确认通过该分销申请？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          this.setData({ actionLoading: true });
          await approveDistributor(openid);
          Toast({ context: this, selector: '#t-toast', message: '已通过' });
          this.init();
        } catch (err) {
          Toast({ context: this, selector: '#t-toast', message: err.message || '操作失败' });
        } finally {
          this.setData({ actionLoading: false });
        }
      },
    });
  },

  openReject(e) {
    const openid = e.currentTarget.dataset.openid;
    if (!openid) return;
    this.setData({ rejectVisible: true, rejectOpenid: openid, rejectReason: '' });
  },

  closeReject() {
    this.setData({ rejectVisible: false, rejectOpenid: '', rejectReason: '' });
  },

  onRejectVisibleChange(e) {
    const visible = !!e.detail.visible;
    if (!visible) {
      this.closeReject();
      return;
    }
    this.setData({ rejectVisible: true });
  },

  onRejectReasonChange(e) {
    this.setData({ rejectReason: e.detail.value });
  },

  async confirmReject() {
    const { rejectOpenid, rejectReason, actionLoading } = this.data;
    if (!rejectOpenid || actionLoading) return;
    try {
      this.setData({ actionLoading: true });
      await rejectDistributor(rejectOpenid, rejectReason || '审核拒绝');
      Toast({ context: this, selector: '#t-toast', message: '已拒绝' });
      this.closeReject();
      this.init();
    } catch (err) {
      Toast({ context: this, selector: '#t-toast', message: err.message || '操作失败' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },
});
