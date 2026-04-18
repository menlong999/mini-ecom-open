import Toast from 'tdesign-miniprogram/toast/index';
import { priceFormat } from '../../../utils/util';
import { ServiceType, ServiceReceiptStatus } from '../../../services/order/orderConfig';
import reasonSheet from '../components/reason-sheet/reasonSheet';
import {
  fetchRightsPreview,
  fetchApplyReasonList,
  dispatchApplyService,
  uploadImages,
} from '../../../services/order/applyService';

Page({
  query: {},
  data: {
    uploading: false, // 凭证上传状态
    canApplyReturn: true, // 是否可退货
    goodsList: [],
    receiptStatusList: [
      { desc: '未收到货', status: ServiceReceiptStatus.NOT_RECEIPTED },
      { desc: '已收到货', status: ServiceReceiptStatus.RECEIPTED },
    ],
    serviceType: null, // 20-仅退款，10-退货退款

    // 重构：与数据库模型 AfterService 保持一致
    formData: {
      logisticsStatus: null, // 对应 logisticsStatus (仅退款时可能需要)
      reason: { desc: '请选择', type: null },
      amount: { max: 0, current: 0, temp: 0, focus: false }, // 部分 UI 状态仍需保留，但尽量扁平
      desc: '', // 对应 desc
      images: [], // 对应 images
    },

    amountTip: '',
    showReceiptStatusDialog: false,
    validateRes: {
      valid: false,
      msg: '',
    },
    submitting: false,
    inputDialogVisible: false,
    uploadGridConfig: {
      column: 3,
      width: 212,
      height: 212,
    },
    serviceRequireType: '',
  },

  getSelectedGoods() {
    return (this.data.goodsList || []).filter((item) => item.selected);
  },

  recalcTotals() {
    const selectedGoods = this.getSelectedGoods();
    const totalAmount = selectedGoods.reduce((sum, item) => {
      const quantity = Number(item.refundQuantity) || 0;
      const price = Number(item.price) || 0;
      return sum + price * quantity;
    }, 0);

    const amountMax = totalAmount;
    let amountCurrent = this.data.formData.amount.current;
    if (!amountCurrent || amountCurrent > amountMax) {
      amountCurrent = amountMax;
    }
    if (amountCurrent < 0 || Number.isNaN(amountCurrent)) amountCurrent = 0;

    this.setData(
      {
        'formData.amount.max': amountMax,
        'formData.amount.current': amountCurrent,
        'formData.amount.temp': priceFormat(amountCurrent),
        amountTip: `最多可退 ¥${priceFormat(amountMax)}`,
      },
      () => this.validate()
    );
  },

  validate() {
    let valid = true;
    let msg = '';
    const selectedGoods = this.getSelectedGoods();
    const { amount } = this.data.formData;

    if (!selectedGoods.length) {
      valid = false;
      msg = '请选择售后商品';
    } else if (!this.data.formData.reason.type) {
      valid = false;
      msg = '请填写退款原因';
    } else if (!amount.current) {
      valid = false;
      msg = '请填写退款金额';
    }

    if (amount.current <= 0) {
      valid = false;
      msg = '退款金额必须大于0';
    } else if (amount.current > amount.max) {
      valid = false;
      msg = '退款金额不能超过可退金额';
    }

    this.setData({ validateRes: { valid, msg } });
  },

  onLoad(query) {
    this.query = query || {};
    if (!this.validateQuery()) return;
    this.setData({
      canApplyReturn: query.canApplyReturn !== 'false', // 默认为 true，除非明确 false
    });
    this.applyServiceTypeFromQuery();
    this.fetchInitialData();
  },

  validateQuery() {
    if (!this.query.orderId) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '参数错误',
      });
      setTimeout(() => wx.navigateBack(), 1000);
      return false;
    }
    return true;
  },

  applyServiceTypeFromQuery() {
    const rawType = this.query.serviceType || this.query.type || '';
    if (!rawType) return;
    const normalized = String(rawType).toUpperCase();
    const serviceType =
      normalized === 'ONLY_REFUND' || normalized === 'REFUND' || normalized === '20'
        ? ServiceType.ONLY_REFUND
        : normalized === 'RETURN_GOODS' || normalized === 'RETURN' || normalized === '10'
        ? ServiceType.RETURN_GOODS
        : null;

    if (!serviceType) return;
    if (serviceType === ServiceType.RETURN_GOODS && !this.data.canApplyReturn) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '该商品不支持退货退款',
      });
      return;
    }

    if (serviceType === ServiceType.ONLY_REFUND) {
      this.handleApplyOnlyRefund();
    } else {
      this.handleApplyReturnGoods();
    }
  },

  async fetchInitialData() {
    try {
      // 1. 获取订单商品预览信息
      const res = await fetchRightsPreview({
        orderId: this.query.orderId,
      });

      const { goodsList = [] } = res.data || {};
      const preselectSkuId = this.query.skuId;
      const mappedList = goodsList.map((item) => ({
        ...item,
        selected: preselectSkuId ? item.skuId === preselectSkuId : true,
        refundQuantity: item.quantity,
      }));

      const hasPreselect = preselectSkuId
        ? mappedList.some((item) => item.skuId === preselectSkuId)
        : true;

      const finalList = hasPreselect
        ? mappedList
        : mappedList.map((item) => ({ ...item, selected: true }));

      this.setData(
        {
          goodsList: finalList,
        },
        () => this.recalcTotals()
      );
    } catch (err) {
      console.error(err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '获取订单信息失败',
      });
    }
  },

  // --- 事件处理 ---

  // 选择仅退款
  handleApplyOnlyRefund() {
    this.setData({
      serviceType: ServiceType.ONLY_REFUND,
      serviceRequireType: 'REFUND', // UI控制字段
    });
    wx.setNavigationBarTitle({ title: '申请退款' });
  },

  // 选择退货退款
  handleApplyReturnGoods() {
    this.setData({
      serviceType: ServiceType.RETURN_GOODS,
      serviceRequireType: 'RETURN', // UI控制字段
    });
    wx.setNavigationBarTitle({ title: '退货退款' });
  },

  // 展开收货状态选择
  handleApplyGoodsStatus() {
    this.setData({ showReceiptStatusDialog: true });
  },

  // 确认收货状态
  handleReceiptStatusDialogConfirm(e) {
    const { index } = e.currentTarget.dataset;
    if (index !== undefined) {
      const statusItem = this.data.receiptStatusList[index];
      this.setData({ 'formData.logisticsStatus': statusItem }); // 保存完整对象或仅状态码，建议保存对象以便显示
    }
    this.setData({ showReceiptStatusDialog: false });
  },

  // 展开原因选择
  // 展开原因选择
  async handleApplyReturnGoodsStatus() {
    try {
      const { data } = await fetchApplyReasonList();
      const rightsReasonList = data.rightsReasonList;
      const currentType = this.data.formData.reason.type;

      const sheetOptions = rightsReasonList.map((r) => ({
        title: r.desc,
        checked: r.id === currentType,
      }));

      reasonSheet({
        show: true,
        title: '选择退款原因',
        options: sheetOptions,
        emptyTip: '请选择原因',
        showConfirmButton: false, // 单选模式通常不需要确认按钮，点击即选
        multiple: false,
      })
        .then((indexes) => {
          if (indexes && indexes.length > 0) {
            const index = indexes[0];
            const selected = rightsReasonList[index];
            this.setData(
              {
                'formData.reason': { type: selected.id, desc: selected.desc },
              },
              () => this.validate()
            );
          }
        })
        .catch(() => {
          // Cancelled
        });
    } catch (err) {
      console.error(err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '获取原因列表失败',
      });
    }
  },

  handleGoodsSelectChange(e) {
    const { index } = e.currentTarget.dataset;
    const checked = !!(e && e.detail && e.detail.checked);
    const key = `goodsList[${index}].selected`;
    this.setData({ [key]: checked }, () => this.recalcTotals());
  },

  // 数量变更
  handleChangeReturnNum(e) {
    const { index } = e.currentTarget.dataset;
    const count = Number(e.detail.value) || 0;
    const key = `goodsList[${index}].refundQuantity`;
    this.setData({ [key]: count }, () => this.recalcTotals());
  },

  // 金额点击（弹出输入框）
  handleAmountTap() {
    this.setData({
      inputDialogVisible: true,
      'formData.amount.focus': true,
      'formData.amount.temp': priceFormat(this.data.formData.amount.current), // 重置为当前值
    });
  },

  // 金额输入
  handleAmountInput(e) {
    console.log('[handleAmountInput] Val:', e.detail.value);
    this.setData({ 'formData.amount.temp': e.detail.value });
  },

  handleAmountFocus() {
    this.setData({ 'formData.amount.focus': true });
  },

  handleAmountBlur() {
    this.setData({ 'formData.amount.focus': false });
    const val = parseFloat(this.data.formData.amount.temp);
    // Val is Yuan. Ensure it doesn't exceed max.
    let currentYuan = val;
    if (isNaN(currentYuan) || currentYuan < 0) currentYuan = 0;

    const maxYuan = this.data.formData.amount.max;
    console.log('[handleAmountBlur] Val:', val, 'MaxYuan:', maxYuan, 'CurrentYuan:', currentYuan);

    if (currentYuan > maxYuan) {
      console.warn('[handleAmountBlur] Exceeds max, resetting to max');
      currentYuan = maxYuan;
      Toast({
        context: this,
        selector: '#t-toast',
        message: '不能超过最大可退金额',
      });
    }

    this.setData(
      {
        'formData.amount.current': currentYuan,
        'formData.amount.temp': priceFormat(currentYuan),
        inputDialogVisible: false,
      },
      () => this.validate()
    );
  },

  // 说明输入框变更： wxml中 textarea 绑定的是 remarkChange
  handleRemarkChange(e) {
    this.setData({ 'formData.desc': e.detail.value });
  },

  // --- 图片上传 ---
  handleSuccess(e) {
    const { files } = e.detail;
    // t-upload returns { files: [...] }
    this.setData({ 'formData.images': files }, () => this.validate());
  },

  handleRemove(e) {
    const { index } = e.detail;
    const { images } = this.data.formData;
    images.splice(index, 1);
    this.setData({ 'formData.images': images }, () => this.validate());
  },

  handleComplete() {
    this.setData({ uploading: false });
  },

  handleSelectChange() {
    this.setData({ uploading: true });
  },

  // 提交
  async handleSubmit() {
    if (this.data.submitting) return;

    // Explicitly validate again just in case
    this.validate();
    if (!this.data.validateRes.valid) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: this.data.validateRes.msg,
      });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const { formData, serviceType } = this.data;
      const query = this.query;
      const selectedGoods = this.getSelectedGoods();

      if (!selectedGoods.length) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '请选择售后商品',
        });
        return;
      }

      const params = {
        orderId: query.orderId,
        goodsList: selectedGoods.map((item) => ({
          skuId: item.skuId,
          refundQuantity: item.refundQuantity,
        })),
        type: serviceType,

        reasonType: parseInt(formData.reason.type),
        reason: formData.reason.desc,
        amount: formData.amount.current,
        images: await uploadImages(formData.images),
        desc: formData.desc,
        // 可选
        logisticsStatus: formData.logisticsStatus ? formData.logisticsStatus.status : null,
      };

      await dispatchApplyService(params);

      Toast({
        context: this,
        selector: '#t-toast',
        message: '提交成功',
        theme: 'success',
      });

      // 跳转到列表或详情
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order/after-service-list/index`,
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      Toast({
        context: this,
        selector: '#t-toast',
        message: err.message || '提交失败',
        theme: 'fail',
      });
    } finally {
      wx.hideLoading();
      this.setData({ submitting: false });
    }
  },
});
