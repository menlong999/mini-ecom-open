import Toast from 'tdesign-miniprogram/toast/index';
import {
  ServiceType,
  ServiceTypeDesc,
  AfterServiceStatus,
} from '../../../../services/order/orderConfig';
import { formatTime } from '../../../../utils/util';
import {
  fetchAdminAfterServiceDetail,
  approveAfterService,
  rejectAfterService,
  confirmAfterServiceReceive,
  markAfterServiceAbnormal,
  refundAfterService,
  closeAfterService,
} from '../../services/afterServiceMgr';

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
    loading: false,
    actionLoading: false,
    serviceRaw: {},
    service: {},
    actionState: {},
    actionRemark: '',
    refundAmount: '',
    refundTraceNo: '',
    approvedAmount: '',
  },

  onLoad(query) {
    const rightsNo = query.rightsNo;
    if (!rightsNo) {
      Toast({ context: this, selector: '#t-toast', message: '缺少售后单号' });
      wx.navigateBack();
      return;
    }
    this.rightsNo = rightsNo;
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const serviceRaw = await fetchAdminAfterServiceDetail({ rightsNo: this.rightsNo });
      const service = this.formatService(serviceRaw);
      const actionState = this.getActionState(serviceRaw);
      this.setData({
        serviceRaw,
        service,
        actionState,
        refundAmount:
          typeof serviceRaw.amount === 'number' ? (serviceRaw.amount / 100).toFixed(2) : '',
        refundTraceNo: serviceRaw.refund ? serviceRaw.refund.traceNo || '' : '',
        approvedAmount:
          serviceRaw.audit && typeof serviceRaw.audit.approvedAmount === 'number'
            ? (serviceRaw.audit.approvedAmount / 100).toFixed(2)
            : serviceRaw.amount || serviceRaw.applyAmount
            ? ((serviceRaw.amount || serviceRaw.applyAmount) / 100).toFixed(2)
            : '',
        loading: false,
      });
    } catch (err) {
      console.error(err);
      this.setData({ loading: false });
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
      wx.navigateBack();
    }
  },

  formatService(serviceRaw) {
    const rawGoodsList = Array.isArray(serviceRaw.goods)
      ? serviceRaw.goods
      : serviceRaw.goods
      ? [serviceRaw.goods]
      : [];
    const goodsList = rawGoodsList.map((goods) => ({
      title: goods.title || '-',
      specs: formatSpecs(goods),
      price: goods.price || 0,
      quantity: goods.refundQuantity || goods.quantity || 0,
    }));
    const historyList = Array.isArray(serviceRaw.history)
      ? serviceRaw.history.map((item) => {
          let statusDesc = STATUS_MAP[item.status] || '处理中';
          if (item.remark && item.remark.includes('发起退款')) {
            statusDesc = '退款中';
          }
          return {
            status: item.status,
            statusDesc,
            timeText: item.time ? formatTime(item.time, 'YYYY-MM-DD HH:mm') : '-',
            operator: item.operator || '-',
            remark: item.remark || '',
          };
        })
      : [];

    const isRefundProcessing = serviceRaw.refund && serviceRaw.refund.status === 'PROCESSING';
    const statusDesc = isRefundProcessing ? '退款中' : STATUS_MAP[serviceRaw.status] || '处理中';

    return {
      rightsNo: serviceRaw.rightsNo,
      orderNo: serviceRaw.orderNo,
      type: serviceRaw.type,
      typeDesc: ServiceTypeDesc[serviceRaw.type] || '售后',
      status: serviceRaw.status,
      statusDesc,
      amount: serviceRaw.amount,
      applyAmount: serviceRaw.applyAmount,
      approvedAmount: serviceRaw.audit ? serviceRaw.audit.approvedAmount : undefined,
      reason: serviceRaw.reason,
      desc: serviceRaw.desc,
      quantity: serviceRaw.quantity,
      goodsList,
      historyList,
      createdAtText: serviceRaw.createdAt
        ? formatTime(serviceRaw.createdAt, 'YYYY-MM-DD HH:mm')
        : '-',
      updatedAtText: serviceRaw.updatedAt
        ? formatTime(serviceRaw.updatedAt, 'YYYY-MM-DD HH:mm')
        : '-',
      images: serviceRaw.images || [],
      logistics: serviceRaw.logistics || {},
      logisticsUpdatedAt:
        serviceRaw.logistics && serviceRaw.logistics.updatedAt
          ? formatTime(serviceRaw.logistics.updatedAt, 'YYYY-MM-DD HH:mm')
          : '',
      audit: serviceRaw.audit || {},
      auditTimeText:
        serviceRaw.audit && serviceRaw.audit.time
          ? formatTime(serviceRaw.audit.time, 'YYYY-MM-DD HH:mm')
          : '',
      refund: serviceRaw.refund || {},
      refundTimeText:
        serviceRaw.refund && serviceRaw.refund.time
          ? formatTime(serviceRaw.refund.time, 'YYYY-MM-DD HH:mm')
          : '',
    };
  },

  getActionState(serviceRaw) {
    const status = Number(serviceRaw.status);
    const type = Number(serviceRaw.type);
    const hasLogistics = serviceRaw.logistics && serviceRaw.logistics.logisticsNo;
    const isRefundProcessing = serviceRaw.refund && serviceRaw.refund.status === 'PROCESSING';

    return {
      canApprove: status === AfterServiceStatus.TO_AUDIT,
      canReject: status === AfterServiceStatus.TO_AUDIT,
      canConfirmReceive:
        type === ServiceType.RETURN_GOODS &&
        status === AfterServiceStatus.THE_APPROVED &&
        hasLogistics &&
        !isRefundProcessing,
      canMarkAbnormal:
        type === ServiceType.RETURN_GOODS &&
        status === AfterServiceStatus.THE_APPROVED &&
        hasLogistics &&
        !isRefundProcessing,
      canRefund:
        !isRefundProcessing &&
        ((type !== ServiceType.RETURN_GOODS && status === AfterServiceStatus.THE_APPROVED) ||
          [
            AfterServiceStatus.HAVE_THE_GOODS,
            AfterServiceStatus.ABNORMAL_RECEIVING,
            AfterServiceStatus.REFUND_ABNORMAL,
          ].includes(status)),
      canClose:
        !isRefundProcessing &&
        ![AfterServiceStatus.COMPLETE, AfterServiceStatus.CLOSED].includes(status),
      needLogistics:
        type === ServiceType.RETURN_GOODS &&
        status === AfterServiceStatus.THE_APPROVED &&
        !hasLogistics,
      isRefundProcessing,
    };
  },

  onRemarkChange(e) {
    this.setData({ actionRemark: e.detail.value });
  },

  onRefundAmountChange(e) {
    this.setData({ refundAmount: e.detail.value });
  },

  onRefundTraceChange(e) {
    this.setData({ refundTraceNo: e.detail.value });
  },

  onApprovedAmountChange(e) {
    this.setData({ approvedAmount: e.detail.value });
  },

  async handleApprove() {
    await this.handleAction(async () => {
      const rawAmount = this.data.approvedAmount;
      let approvedAmount =
        rawAmount === '' || rawAmount === null || rawAmount === undefined
          ? undefined
          : Number(rawAmount);
      if (approvedAmount !== undefined) {
        if (Number.isNaN(approvedAmount) || approvedAmount <= 0) {
          throw new Error('审核金额不合法');
        }
        approvedAmount = Math.round(approvedAmount * 100);
      }
      await approveAfterService({
        rightsNo: this.rightsNo,
        remark: this.data.actionRemark,
        approvedAmount,
      });
      Toast({ context: this, selector: '#t-toast', message: '已同意售后' });
    });
  },

  async handleReject() {
    await this.handleAction(async () => {
      await rejectAfterService({ rightsNo: this.rightsNo, remark: this.data.actionRemark });
      Toast({ context: this, selector: '#t-toast', message: '已拒绝售后' });
    });
  },

  async handleConfirmReceive() {
    await this.handleAction(async () => {
      await confirmAfterServiceReceive({ rightsNo: this.rightsNo, remark: this.data.actionRemark });
      Toast({ context: this, selector: '#t-toast', message: '已确认收货' });
    });
  },

  async handleMarkAbnormal() {
    await this.handleAction(async () => {
      await markAfterServiceAbnormal({ rightsNo: this.rightsNo, remark: this.data.actionRemark });
      Toast({ context: this, selector: '#t-toast', message: '已标记异常' });
    });
  },

  async handleRefund() {
    await this.handleAction(async () => {
      const rawAmount = this.data.refundAmount;
      let amount =
        rawAmount === '' || rawAmount === null || rawAmount === undefined
          ? undefined
          : Number(rawAmount);
      if (amount !== undefined) {
        if (Number.isNaN(amount) || amount <= 0) {
          throw new Error('退款金额不合法');
        }
        amount = Math.round(amount * 100);
      }

      const approvedAmount =
        this.data.serviceRaw &&
        this.data.serviceRaw.audit &&
        typeof this.data.serviceRaw.audit.approvedAmount === 'number'
          ? this.data.serviceRaw.audit.approvedAmount
          : this.data.serviceRaw
          ? this.data.serviceRaw.amount
          : undefined;

      if (
        approvedAmount !== undefined &&
        amount !== undefined &&
        amount !== approvedAmount &&
        !this.data.actionRemark
      ) {
        throw new Error('退款金额与审核金额不一致，请填写原因说明');
      }

      await refundAfterService({
        rightsNo: this.rightsNo,
        amount,
        traceNo: this.data.refundTraceNo,
        remark: this.data.actionRemark,
      });
      Toast({ context: this, selector: '#t-toast', message: '退款已发起' });
    });
  },

  async handleClose() {
    await this.handleAction(async () => {
      await closeAfterService({ rightsNo: this.rightsNo, remark: this.data.actionRemark });
      Toast({ context: this, selector: '#t-toast', message: '已关闭售后' });
    });
  },

  async handleAction(action) {
    if (this.data.actionLoading) return;
    this.setData({ actionLoading: true });
    try {
      await action();
      await this.loadDetail();
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '操作失败' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },
});
