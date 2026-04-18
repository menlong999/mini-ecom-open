import Toast from 'tdesign-miniprogram/toast/index';
import {
  ServiceType,
  ServiceTypeDesc,
  AfterServiceStatus,
  ServiceButtonTypes,
} from '../../../services/order/orderConfig';
import { formatTime } from '../../../utils/util';
import { fetchServiceDetail, getAfterServiceButtons } from '../../../services/order/afterService';
import { runtimeConfig } from '../../../config/index';

const formatSpecs = (goods) => {
  if (!goods) return '';
  if (Array.isArray(goods.specs)) return goods.specs.join(' / ');
  if (typeof goods.specs === 'string' && goods.specs) return goods.specs;
  if (Array.isArray(goods.specInfo)) {
    return goods.specInfo
      .map((s) => s.specValue || '')
      .filter(Boolean)
      .join(' / ');
  }
  return '';
};

const TitleConfig = {
  [ServiceType.ORDER_CANCEL]: '退款详情',
  [ServiceType.ONLY_REFUND]: '退款详情',
  [ServiceType.RETURN_GOODS]: '退货退款详情',
};

const RETURN_ADDRESS =
  (runtimeConfig.afterService && runtimeConfig.afterService.returnAddress) || {};

Page({
  data: {
    pageLoading: true,
    serviceRaw: {},
    service: {},
    logisticsService: {},
    hasBottomActions: false,
    deliveryButton: {},
    gallery: {
      current: 0,
      show: false,
      proofs: [],
    },
    showProofs: false,
    backRefresh: false,
  },

  onLoad(query) {
    this.rightsNo = query.rightsNo;
    this.inputDialog = this.selectComponent('#input-dialog');
    this.init();
  },

  onShow() {
    // 当从其他页面返回，并且 backRefresh 被置为 true 时，刷新数据
    if (!this.data.backRefresh) return;
    this.init();
    this.setData({ backRefresh: false });
  },

  // 页面刷新，展示下拉刷新
  handlePullDownRefresh(e) {
    const { callback } = e.detail;
    return this.fetchServiceData().then(() => callback && callback());
  },

  init() {
    this.setData({ pageLoading: true });
    this.fetchServiceData().then(() => {
      this.setData({ pageLoading: false });
    });
  },

  fetchServiceData() {
    return fetchServiceDetail(this.rightsNo).then((serviceRaw) => {
      // 适配订单级售后数据模型
      const rawGoodsList = Array.isArray(serviceRaw.goods)
        ? serviceRaw.goods
        : serviceRaw.goods
        ? [serviceRaw.goods]
        : [];
      const goodsList = rawGoodsList.map((goods) => ({
        id: goods.skuId,
        thumb: goods.thumb,
        title: goods.title,
        specs: formatSpecs(goods),
        itemRefundAmount: goods.price || 0,
        rightsQuantity: goods.refundQuantity || goods.quantity || 0,
      }));

      const rawButtons = getAfterServiceButtons({
        status: serviceRaw.status,
        type: serviceRaw.type,
        logisticsNo: serviceRaw.logistics ? serviceRaw.logistics.logisticsNo : '',
      });
      const hasLogistics = !!(serviceRaw.logistics && serviceRaw.logistics.logisticsNo);
      const logisticsButtons = rawButtons.filter(
        (btn) => btn.type === ServiceButtonTypes.VIEW_DELIVERY
      );
      const actionButtons =
        hasLogistics && logisticsButtons.length
          ? rawButtons.filter((btn) => btn.type !== ServiceButtonTypes.VIEW_DELIVERY)
          : rawButtons;
      const hasReturnAddress =
        !!RETURN_ADDRESS.name && !!RETURN_ADDRESS.phone && !!RETURN_ADDRESS.address;

      const service = {
        serviceNo: serviceRaw.rightsNo,
        type: serviceRaw.type,
        typeDesc: ServiceTypeDesc[serviceRaw.type],
        status: serviceRaw.status,
        statusIcon: this.getStatusIcon(serviceRaw),
        statusName: this.getStatusName(serviceRaw.status),
        statusDesc: this.getStatusDesc(serviceRaw.status),
        amount: serviceRaw.amount,
        goodsList,
        orderNo: serviceRaw.orderNo,
        rightsNo: serviceRaw.rightsNo,
        rightsReasonDesc: serviceRaw.reason,
        isRefunded: serviceRaw.status === AfterServiceStatus.COMPLETE,
        refundMethodList: [], // 暂时为空
        refundRequestAmount: serviceRaw.amount,
        applyAmount: serviceRaw.applyAmount,
        approvedAmount: serviceRaw.audit ? serviceRaw.audit.approvedAmount : undefined,
        payTraceNo: serviceRaw.refund ? serviceRaw.refund.traceNo || '' : '',
        createTime: formatTime(serviceRaw.createdAt, 'YYYY-MM-DD HH:mm'),
        logisticsNo: serviceRaw.logistics ? serviceRaw.logistics.logisticsNo : '',
        logisticsCompanyName: serviceRaw.logistics ? serviceRaw.logistics.companyName : '',
        logisticsCompanyCode: serviceRaw.logistics ? serviceRaw.logistics.companyCode : '',
        remark: serviceRaw.logistics ? serviceRaw.logistics.remark || '' : '',
        // 退货地址 (商家收货地址) - 仅在退货且已审核通过后显示
        receiverName:
          serviceRaw.type === ServiceType.RETURN_GOODS &&
          serviceRaw.status >= AfterServiceStatus.THE_APPROVED &&
          hasReturnAddress
            ? RETURN_ADDRESS.name
            : '',
        receiverPhone:
          serviceRaw.type === ServiceType.RETURN_GOODS &&
          serviceRaw.status >= AfterServiceStatus.THE_APPROVED &&
          hasReturnAddress
            ? RETURN_ADDRESS.phone
            : '',
        receiverAddress:
          serviceRaw.type === ServiceType.RETURN_GOODS &&
          serviceRaw.status >= AfterServiceStatus.THE_APPROVED &&
          hasReturnAddress
            ? RETURN_ADDRESS.address
            : '',
        applyRemark: serviceRaw.desc,
        buttons: actionButtons,
        logistics: serviceRaw.logistics || {},
      };

      const proofs = serviceRaw.images || [];
      this.setData({
        serviceRaw,
        service,
        logisticsService:
          hasLogistics && logisticsButtons.length ? { ...service, buttons: logisticsButtons } : {},
        hasBottomActions: actionButtons.length > 0,
        deliveryButton: {},
        'gallery.proofs': proofs,
        showProofs: proofs.length > 0,
      });
      wx.setNavigationBarTitle({
        title: TitleConfig[service.type],
      });
    });
  },

  handleRefresh() {
    this.init();
  },

  openLogisticsDialog() {
    this.setData({
      inputDialogVisible: true,
    });
    this.inputDialog.setData({
      cancelBtn: '取消',
      confirmBtn: '确定',
    });
    this.inputDialog._onConfirm = () => {
      Toast({
        message: '确定填写物流单号',
      });
    };
  },

  handleProofTap(e) {
    if (this.data.gallery.show) {
      this.setData({
        'gallery.show': false,
      });
      return;
    }
    const { index } = e.currentTarget.dataset;
    this.setData({
      'gallery.show': true,
      'gallery.current': index,
    });
  },

  handleGoodsCardTap(e) {
    const { index } = e.currentTarget.dataset;
    const rawGoodsList = Array.isArray(this.data.serviceRaw.goods)
      ? this.data.serviceRaw.goods
      : this.data.serviceRaw.goods
      ? [this.data.serviceRaw.goods]
      : [];
    const goods = rawGoodsList[index];
    if (!goods) return;
    wx.navigateTo({ url: `/pages/goods/details/index?skuId=${goods.skuId}` });
  },

  handleServiceNoCopy() {
    wx.setClipboardData({
      data: this.data.service.serviceNo,
    });
  },

  handleAddressCopy() {
    wx.setClipboardData({
      data: `${this.data.service.receiverName}  ${this.data.service.receiverPhone}\n${this.data.service.receiverAddress}`,
    });
  },

  /** 获取状态ICON */
  getStatusIcon(item) {
    const status = item.status;
    if (status === AfterServiceStatus.COMPLETE) return 'succeed';
    if (status === AfterServiceStatus.CLOSED) return 'indent_close';
    if (status === AfterServiceStatus.REFUND_ABNORMAL) return 'indent_close';
    return item.type === ServiceType.ONLY_REFUND ? 'goods_refund' : 'goods_return';
  },

  getStatusName(status) {
    switch (status) {
      case AfterServiceStatus.TO_AUDIT:
        return '待审核';
      case AfterServiceStatus.THE_APPROVED:
        return '已审核';
      case AfterServiceStatus.HAVE_THE_GOODS:
        return '已收货';
      case AfterServiceStatus.ABNORMAL_RECEIVING:
        return '收货异常';
      case AfterServiceStatus.COMPLETE:
        return '已完成';
      case AfterServiceStatus.CLOSED:
        return '已关闭';
      case AfterServiceStatus.REFUND_ABNORMAL:
        return '退款异常';
      default:
        return '未知状态';
    }
  },

  getStatusDesc(status) {
    if (status === AfterServiceStatus.TO_AUDIT) return '等待商家审核';
    if (status === AfterServiceStatus.THE_APPROVED) return '商家已同意，请尽快退货';
    if (status === AfterServiceStatus.COMPLETE) return '退款已完成';
    if (status === AfterServiceStatus.CLOSED) return '售后单已关闭';
    if (status === AfterServiceStatus.REFUND_ABNORMAL) return '退款异常/关闭，请联系客服';
    return '';
  },
});
