import Toast from 'tdesign-miniprogram/toast/index';
import {
  fetchAdminOrderDetail,
  shipOrder,
  updateOrderLogistics,
  confirmPickup,
} from '../../../../services/admin/orderMgr';
import { getDeliverCompanyList } from '../../../../services/order/logistics';
import { getOrderStatusDesc } from '../../../../utils/orderHelper';

const buildOperatorText = (logistics = {}) => {
  const operator = logistics.operator || '';
  return operator || '';
};

Page({
  data: {
    order: {},
    deliveryTypeText: '',
    deliveryCompany: {},
    deliveryCompanyCode: '',
    logisticsNo: '',
    remark: '',
    operatorText: '',
    companyOptions: [],
    showCompanyPicker: false,
    submitting: false,
    mode: 'ship',
    submitText: '确认发货',
    isPickup: false,
  },

  markPrevPageRefresh() {
    const pages = getCurrentPages();
    const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
    if (prevPage && typeof prevPage.setData === 'function') {
      prevPage.setData({ backRefresh: true });
    }
  },

  onLoad(query) {
    const orderId = query.orderId || '';
    const mode = query.mode === 'update' ? 'update' : query.mode === 'pickup' ? 'pickup' : 'ship';
    if (!orderId) {
      Toast({ context: this, selector: '#t-toast', message: '订单ID缺失' });
      wx.navigateBack();
      return;
    }
    this.orderId = orderId;
    this.setData({
      mode,
      submitText: mode === 'ship' ? '确认发货' : mode === 'pickup' ? '确认提货' : '保存修改',
    });
    this.loadCompanies();
    this.loadOrderDetail();
  },

  async loadOrderDetail() {
    try {
      const order = await fetchAdminOrderDetail(this.orderId);
      const logistics = order.logistics || {};
      const isPickup = Number(order.deliveryType) === 2;
      const deliveryTypeText = isPickup ? '门店自提' : '快递配送';
      const statusDesc = getOrderStatusDesc(order.status, order.deliveryType);
      const mode = isPickup ? 'pickup' : this.data.mode;
      const operatorText = buildOperatorText(logistics);

      this.setData({
        order: { ...order, statusDesc },
        deliveryTypeText,
        logisticsNo: logistics.logisticsNo || '',
        remark: logistics.remark || '',
        operatorText,
        deliveryCompany: logistics.companyCode
          ? {
              code: logistics.companyCode,
              name: logistics.companyName,
            }
          : {},
        deliveryCompanyCode: logistics.companyCode || '',
        isPickup,
        mode,
        submitText: mode === 'ship' ? '确认发货' : mode === 'pickup' ? '确认提货' : '保存修改',
      });

      if (isPickup) {
        wx.setNavigationBarTitle({ title: '确认提货' });
      }
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载订单失败' });
      wx.navigateBack();
    }
  },

  async loadCompanies() {
    const res = await getDeliverCompanyList();
    const list = res.data || [];
    this.deliveryCompanyList = list;
    this.setData({
      companyOptions: list.map((item) => ({
        label: item.name,
        value: item.code,
      })),
    });
  },

  onCompanyTap() {
    this.setData({ showCompanyPicker: true });
  },

  onCompanyPickerChange(e) {
    const code = e.detail.value[0];
    const selected = (this.deliveryCompanyList || []).find((item) => item.code === code);
    if (selected) {
      this.setData({
        deliveryCompany: selected,
        deliveryCompanyCode: selected.code,
      });
    }
    this.setData({ showCompanyPicker: false });
  },

  onCompanyPickerCancel() {
    this.setData({ showCompanyPicker: false });
  },

  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    if (!field) return;
    this.setData({ [field]: e.detail.value });
  },

  async onSubmit() {
    if (this.data.submitting) return;

    const { deliveryCompany, logisticsNo, remark, mode, isPickup } = this.data;
    if (isPickup) {
      this.setData({ submitting: true });
      try {
        await confirmPickup({
          orderId: this.orderId,
          remark,
        });
        Toast({ context: this, selector: '#t-toast', message: '已确认提货' });
        this.markPrevPageRefresh();
        setTimeout(() => wx.navigateBack(), 800);
      } catch (err) {
        console.error(err);
        Toast({ context: this, selector: '#t-toast', message: err.message || '操作失败' });
      } finally {
        this.setData({ submitting: false });
      }
      return;
    }

    if (!deliveryCompany || !deliveryCompany.code) {
      Toast({ context: this, selector: '#t-toast', message: '请选择物流公司' });
      return;
    }
    if (!logisticsNo) {
      Toast({ context: this, selector: '#t-toast', message: '请输入运单号' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const payload = {
        orderId: this.orderId,
        logisticsNo,
        companyCode: deliveryCompany.code,
        companyName: deliveryCompany.name,
        remark,
      };
      if (mode === 'ship') {
        await shipOrder(payload);
      } else {
        await updateOrderLogistics(payload);
      }
      Toast({ context: this, selector: '#t-toast', message: '保存成功' });
      this.markPrevPageRefresh();
      setTimeout(() => wx.navigateBack(), 800);
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '操作失败' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
