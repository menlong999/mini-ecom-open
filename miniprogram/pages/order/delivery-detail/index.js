import { fetchLogisticsTrack, getDeliverCompanyList } from '../../../services/order/logistics';

Page({
  data: {
    logisticsData: {
      logisticsNo: '',
      nodes: [],
      companyName: '',
      phoneNumber: '',
    },
    active: 0,
  },

  onLoad(query) {
    const source = Number(query.source);
    // source=1: 订单物流, source=2: 售后物流
    if (source === 1 || source === 2) {
      const service = {
        companyName: query.companyName || '',
        logisticsNo: query.logisticsNo || '',
        nodes: [],
      };
      this.setData({
        logisticsData: service,
      });

      if (query.companyCode) {
        // 1. 获取客服电话
        getDeliverCompanyList().then((res) => {
          const company = (res.data || []).find((c) => c.code === query.companyCode);
          if (company && company.phone) {
            this.setData({
              'logisticsData.phoneNumber': company.phone,
            });
          }
        });

        // 2. 获取物流轨迹
        if (query.logisticsNo) {
          wx.showLoading({ title: '加载物流...', mask: true });
          fetchLogisticsTrack({
            logisticsNo: query.logisticsNo,
            companyCode: query.companyCode,
            companyName: query.companyName,
          })
            .then((data) => {
              wx.hideLoading();
              this.setData({
                'logisticsData.nodes': data.nodes || [],
              });
            })
            .catch((err) => {
              wx.hideLoading();
              console.error('调用物流云函数失败', err);
              this.setData({
                'logisticsData.nodes': [
                  {
                    title: '物流查询失败',
                    desc: '请稍后重试',
                    date: '',
                    icon: 'indent_close',
                  },
                ],
              });
            });
        }
      }
    }
  },

  onLogisticsNoCopy() {
    wx.setClipboardData({ data: this.data.logisticsData.logisticsNo });
  },

  onCall() {
    const { phoneNumber } = this.data.logisticsData;
    wx.makePhoneCall({
      phoneNumber,
    });
  },
});
