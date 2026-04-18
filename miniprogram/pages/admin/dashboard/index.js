import { runtimeConfig } from '../../../config/index';

Page({
  data: {
    reportList: [],
    menuList: [],
  },
  onLoad() {
    const reportList = [{ title: '销售报表', url: '/pages/admin/report/index', icon: 'chart-bar' }];
    const menuList = [
      { title: '首页配置', url: '/pages/admin/home-config/index', icon: 'home' },
      { title: '商品管理', url: '/pages/admin/goods/list/index', icon: 'shop' },
      { title: '库存管理', url: '/pages/admin/stock/index', icon: 'shop' },
      { title: '分类管理', url: '/pages/admin/category/index', icon: 'menu' },
      {
        title: '订单发货',
        url: '/pages/admin/order/list/index',
        icon: { name: 'deliver', prefix: 'wr' },
      },
      { title: '售后处理', url: '/pages/admin/after-service/list/index', icon: 'service' },
    ];

    if (runtimeConfig.features.distributor) {
      reportList.push({
        title: '分销订单',
        url: '/pages/admin/distributor-report/index',
        icon: 'usergroup',
      });
      menuList.push({
        title: '分销审核',
        url: '/pages/admin/distributor/list/index',
        icon: 'usergroup',
      });
    }

    this.setData({ reportList, menuList });
  },

  onMenuTap(e) {
    const { url, disabled } = e.currentTarget.dataset;
    if (disabled) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    if (url) {
      wx.navigateTo({ url });
    }
  },
});
