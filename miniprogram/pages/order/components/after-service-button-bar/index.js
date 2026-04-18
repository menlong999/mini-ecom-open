import Dialog from 'tdesign-miniprogram/dialog/index';
import Toast from 'tdesign-miniprogram/toast/index';

import { cancelService } from '../../../../services/order/afterService';
import { ServiceButtonTypes } from '../../../../services/order/orderConfig';

Component({
  properties: {
    service: {
      type: Object,
      observer(service) {
        const buttonsRight = service.buttons || [];
        this.setData({
          buttons: {
            left: [],
            right: buttonsRight,
          },
        });
      },
    },
  },

  data: {
    buttons: {
      left: [],
      right: [],
    },
  },

  methods: {
    // 点击【订单操作】按钮，根据按钮类型分发
    onServiceBtnTap(e) {
      const { type } = e.currentTarget.dataset;
      switch (type) {
        case ServiceButtonTypes.REVOKE:
          this.onConfirm(this.data.service);
          break;
        case ServiceButtonTypes.FILL_TRACKING_NO:
          this.onFillTrackingNo(this.data.service);
          break;
        case ServiceButtonTypes.CHANGE_TRACKING_NO:
          this.onChangeTrackingNo(this.data.service);
          break;
        case ServiceButtonTypes.VIEW_DELIVERY:
          this.viewDelivery(this.data.service);
          break;
      }
    },

    onFillTrackingNo(service) {
      wx.navigateTo({
        url: `/pages/order/fill-tracking-no/index?rightsNo=${service.rightsNo}`,
      });
    },

    viewDelivery(service) {
      const logistics = service.logistics || {};
      wx.navigateTo({
        url: `/pages/order/delivery-detail/index?logisticsNo=${
          logistics.logisticsNo || ''
        }&companyName=${logistics.companyName || ''}&companyCode=${
          logistics.companyCode || ''
        }&source=2`,
      });
    },

    onChangeTrackingNo(service) {
      wx.navigateTo({
        url: `/pages/order/fill-tracking-no/index?rightsNo=${service.rightsNo}&logisticsNo=${
          service.logisticsNo
        }&logisticsCompanyName=${service.logisticsCompanyName}&logisticsCompanyCode=${
          service.logisticsCompanyCode
        }&remark=${service.remark || ''}`,
      });
    },

    onConfirm() {
      Dialog.confirm({
        title: '是否撤销退货申请？',
        content: '',
        confirmBtn: '撤销申请',
        cancelBtn: '不撤销',
      }).then(() => {
        const params = { rightsNo: this.data.service.rightsNo };
        return cancelService(params.rightsNo).then(() => {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '你确认撤销申请',
          });
          this.triggerEvent('refresh');
        });
      });
    },
  },
});
