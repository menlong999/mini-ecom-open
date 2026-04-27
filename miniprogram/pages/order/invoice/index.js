/* eslint-disable no-nested-ternary */
import Dialog from 'tdesign-miniprogram/dialog/index';
import {
  INVOICE_TYPES,
  TITLE_TYPES,
  CONTENT_TYPES,
} from '../../../services/order/invoiceConstants';
import { runtimeConfig } from '../../../config/index';

const invoiceJson = {
  info: runtimeConfig.invoice?.notice || [],
  codeTitle: runtimeConfig.invoice?.taxCodeNotice || [],
};

Page({
  orderNo: '',
  data: {
    invoiceTypeIndex: INVOICE_TYPES.NONE,
    addressTagsIndex: 0,
    goodsClassesIndex: 0,
    dialogShow: false,
    codeShow: false,
    invoiceTypes: [
      { title: '不开发票', id: 0, name: 'invoiceType', type: INVOICE_TYPES.NONE },
      { title: '电子发票', id: 1, name: 'invoiceType', type: INVOICE_TYPES.ELECTRONIC },
    ],
    addressTags: [
      { title: '个人', id: 0, name: 'addressTags', type: TITLE_TYPES.PERSONAL },
      { title: '公司', id: 1, name: 'addressTags', type: TITLE_TYPES.COMPANY },
    ],
    goodsClasses: [
      { title: '商品明细', id: 0, name: 'goodsClasses', type: CONTENT_TYPES.GOODS_DETAIL },
      { title: '商品类别', id: 1, name: 'goodsClasses', type: CONTENT_TYPES.GOODS_CATEGORY },
    ],
    name: '',
    componentName: '',
    code: '',
    phone: '',
    email: '',
    invoiceInfo: invoiceJson,
  },
  onLoad(query) {
    const { invoiceData } = query;
    const tempData = JSON.parse(invoiceData || '{}');
    const invoice = {
      invoiceTypeIndex: tempData.invoiceType === INVOICE_TYPES.ELECTRONIC ? 1 : 0,
      name: tempData.buyerName || '',
      email: tempData.email || '',
      phone: tempData.buyerPhone || '',
      addressTagsIndex: tempData.titleType === TITLE_TYPES.COMPANY ? 1 : 0,
      goodsClassesIndex: tempData.contentType === CONTENT_TYPES.GOODS_CATEGORY ? 1 : 0,
      code: tempData.buyerTaxNo || '',
      componentName: tempData.titleType === TITLE_TYPES.COMPANY ? tempData.buyerName : '',
    };
    // this.orderNo = orderNo; // Removed dead code
    this.setData({ ...invoice });
  },
  onLabels(e) {
    const { item } = e.currentTarget.dataset;
    const nameIndex = `${item.name}Index`;
    this.setData({ [nameIndex]: item.id });
  },
  onInput(e) {
    const { addressTagsIndex } = this.data;
    const { item } = e.currentTarget.dataset;
    const { value } = e.detail;

    let key = '';
    if (item === 'name') {
      key = addressTagsIndex === 0 ? 'name' : 'componentName';
    } else if (item === 'code') {
      key = addressTagsIndex === 0 ? 'phone' : 'code';
    } else {
      key = 'email';
    }

    if (key) {
      this.setData({ [key]: value });
    }
  },
  onSure() {
    const result = this.checkSure();
    if (!result) {
      Dialog.alert({
        title: '请填写发票信息',
        content: '',
        confirmBtn: '确认',
      });
      return;
    }
    const {
      invoiceTypeIndex,
      addressTagsIndex,
      invoiceTypes,
      addressTags,
      name,
      componentName,
      code,
      phone,
      email,
      goodsClassesIndex,
      goodsClasses,
    } = this.data;

    const data = {
      buyerName: addressTagsIndex === 0 ? name : componentName,
      buyerTaxNo: code,
      buyerPhone: phone,
      email,
      titleType: addressTags[addressTagsIndex].type,
      contentType: goodsClasses[goodsClassesIndex].type,
      invoiceType: invoiceTypes[invoiceTypeIndex].type,
    };

    // Saved to storage and return
    wx.setStorageSync('invoiceData', data);
    wx.navigateBack({ delta: 1 });
  },
  checkSure() {
    const { name, componentName, code, phone, email, addressTagsIndex, invoiceTypeIndex } =
      this.data;
    if (invoiceTypeIndex === 0) {
      return true;
    }
    if (addressTagsIndex === 0) {
      if (!name.length || !phone.length) {
        return false;
      }
    } else if (addressTagsIndex === 1) {
      if (!componentName.length || !code.length) {
        return false;
      }
    }
    if (!email.length) {
      return false;
    }
    return true;
  },
  onDialogTap() {
    const { dialogShow } = this.data;
    this.setData({
      dialogShow: !dialogShow,
      codeShow: false,
    });
  },
  onKnoeCode() {
    this.setData({
      dialogShow: !this.data.dialogShow,
      codeShow: true,
    });
  },
});
