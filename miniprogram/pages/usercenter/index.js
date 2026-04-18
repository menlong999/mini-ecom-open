import { fetchOrderTagInfos, fetchUserInfo } from '../../services/usercenter/fetchUsercenter';
import { dispatchLogin } from '../../services/common/login';
import { generateUserQRCode } from '../../services/usercenter/qrcode';
import { OrderStatus } from '../../services/order/orderConfig';
import { runtimeConfig } from '../../config/index';
import Toast from 'tdesign-miniprogram/toast/index';

function buildMenuData() {
  const firstGroup = [];
  if (runtimeConfig.features.distributor) {
    firstGroup.push({
      title: '我的二维码',
      tit: '',
      url: '',
      type: 'qrcode',
    });
  }
  firstGroup.push({
    title: '收货地址',
    tit: '',
    url: '',
    type: 'address',
  });

  const secondGroup = [
    {
      title: '帮助中心',
      tit: '',
      url: '',
      type: 'help-center',
    },
  ];

  if (runtimeConfig.customerService.phone || runtimeConfig.customerService.showOnlineChat) {
    secondGroup.push({
      title: '客服热线',
      tit: '',
      url: '',
      type: 'service',
      icon: 'service',
    });
  }

  return [firstGroup, secondGroup].filter((group) => group.length > 0);
}

const orderTagInfos = [
  {
    title: '待付款',
    iconName: 'wallet',
    orderNum: 0,
    orderStatus: OrderStatus.PENDING_PAYMENT,
  },
  {
    title: '待发货',
    iconName: 'deliver',
    orderNum: 0,
    orderStatus: OrderStatus.PENDING_DELIVERY,
  },
  {
    title: '待收货',
    iconName: 'package',
    orderNum: 0,
    orderStatus: OrderStatus.PENDING_RECEIPT,
  },
  {
    title: '待评价',
    iconName: 'comment',
    orderNum: 0,
    orderStatus: OrderStatus.COMPLETE,
  },
  {
    title: '退款/售后',
    iconName: 'exchang',
    orderNum: 0,
    orderStatus: 'AFTER_SERVICE',
  },
];

const getDefaultData = () => ({
  showMakePhone: false,
  userInfo: {
    avatarUrl: '',
    nickName: '正在登录...',
    phoneNumber: '',
  },
  menuData: buildMenuData(),
  orderTagInfos,
  customerServiceInfo: {
    servicePhone: runtimeConfig.customerService.phone,
    serviceTimeDuration: runtimeConfig.customerService.serviceTimeDuration,
  },
  currAuthStep: 1,
  showKefu: runtimeConfig.customerService.showOnlineChat,
  tenantFeatures: runtimeConfig.features,
  versionNo: 'v1.0.0',
  showQRCode: false,
  myQRCodeUrl: '',
});

const ONE = 1; // 未登录
const TWO = 2; // 已登录，未授权用户信息
const THREE = 3; // 已登录，已授权

Page({
  data: getDefaultData(),

  onLoad() {
    this.getLocalVersionInfo();
  },

  onShow() {
    this.getTabBar().init();
    // 每次进入页面都检查登录状态
    this.loadLoginStatus();
  },
  onPullDownRefresh() {
    this.handlePullDownRefresh();
  },

  async handlePullDownRefresh() {
    // 刷新时获取最新用户信息和订单数据
    const userInfo = await fetchUserInfo();
    const orderTagInfos = await fetchOrderTagInfos();

    // 更新本地缓存
    if (userInfo && userInfo._openid) {
      wx.setStorageSync('userInfo', userInfo);
    }

    const nextStep =
      userInfo && userInfo.phoneNumber ? THREE : userInfo && userInfo._openid ? TWO : ONE;

    this.setData({
      userInfo,
      orderTagInfos,
      currAuthStep: nextStep,
    });
    wx.stopPullDownRefresh();
  },

  // 页面初始化/刷新数据
  init() {
    this.loadLoginStatus();
  },

  // 检查本地缓存，判断并更新登录状态
  async loadLoginStatus() {
    console.log('checkLoginStatus...');

    // 优先从云端获取最新用户信息，保证状态同步
    let userInfo = wx.getStorageSync('userInfo');

    try {
      const cloudUserInfo = await fetchUserInfo();
      if (cloudUserInfo && cloudUserInfo._openid) {
        userInfo = cloudUserInfo;
        wx.setStorageSync('userInfo', userInfo);
      }
    } catch (e) {
      console.error('loadLoginStatus fetchUserInfo failed', e);
    }

    console.log('current user info:', userInfo);

    // 用户信息保持在缓存中
    if (userInfo && userInfo._openid) {
      const hasProfile = userInfo.nickName && userInfo.nickName !== '微信用户';
      // 获取当前用户的状态
      const orderTagInfos = await fetchOrderTagInfos();
      // 判断AuthStep: 有手机号->3, 否则已登录->2
      const nextStep = userInfo.phoneNumber ? THREE : TWO;

      this.setData({
        userInfo,
        orderTagInfos,
        currAuthStep: nextStep,
        isAdmin: userInfo.role === 'admin', // Check for admin role
      });
      console.log('current auth step:', nextStep, hasProfile, 'isAdmin:', this.data.isAdmin);
    } else {
      this.setData({
        userInfo: {},
        currAuthStep: ONE,
        isAdmin: false,
      });
    }
  },

  // 用户卡片点击统一入口
  handleUserCardClick() {
    const { currAuthStep } = this.data;
    console.log('clickUserHeader, step:', currAuthStep);

    if (currAuthStep === ONE) {
      // 状态一：未登录，执行登录
      this.executeLogin();
    } else {
      // 状态二/三：已登录，统一跳转到个人信息页进行完善/修改
      wx.navigateTo({ url: '/pages/usercenter/person-info/index' });
    }
  },

  // 执行登录流程
  async executeLogin() {
    wx.showLoading({ title: '正在登录...' });
    try {
      const userData = await dispatchLogin();
      console.log('登录调用成功:', userData);

      wx.setStorageSync('userInfo', userData);

      const userInfo = userData;
      // Step 1: 未登录
      // Step 2: 已登录，无手机号 -> 状态2
      // Step 3: 已登录，有手机号 -> 状态3
      const nextStep = userInfo.phoneNumber ? THREE : TWO;

      // 登录成功后刷新订单数量
      this.init();

      this.setData({
        userInfo,
        currAuthStep: nextStep,
      });

      if (nextStep === TWO) {
        Toast({ context: this, selector: '#t-toast', message: '请完善手机号信息' });
        // 下一步可以自动跳转，也可以等待用户点击
      }
    } catch (err) {
      console.log('登录调用失败:', err);
      Toast({ context: this, selector: '#t-toast', message: `登录调用失败: ${err.message}` });
    } finally {
      wx.hideLoading();
    }
  },

  handleCellClick({ currentTarget }) {
    const { type } = currentTarget.dataset;

    switch (type) {
      case 'qrcode': {
        this.handleGenerateQRCode();
        break;
      }
      case 'address': {
        wx.navigateTo({ url: '/pages/usercenter/address/list/index' });
        break;
      }

      case 'service': {
        this.handleOpenMakePhone();
        break;
      }
      case 'help-center': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了帮助中心',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'point': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了积分菜单',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'coupon': {
        wx.navigateTo({ url: '/pages/coupon/coupon-list/index' });
        break;
      }
      default: {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未知跳转',
          icon: '',
          duration: 1000,
        });
        break;
      }
    }
  },

  async handleGenerateQRCode() {
    if (!this.data.tenantFeatures.distributor) {
      Toast({ context: this, selector: '#t-toast', message: '当前版本未开启分销二维码' });
      return;
    }

    const { userInfo } = this.data;
    if (!userInfo || !userInfo.nickName) {
      Toast({ context: this, selector: '#t-toast', message: '请先登录' });
      return;
    }

    if (userInfo.distributorStatus === 'APPROVED' && this.data.myQRCodeUrl) {
      this.setData({ showQRCode: true });
      return;
    }

    wx.showLoading({ title: '处理中...' });

    try {
      const data = await generateUserQRCode();
      console.log('generateQRCode result:', data);
      const status = data && data.status;

      if (status !== 'APPROVED') {
        Toast({
          context: this,
          selector: '#t-toast',
          message: data._message || '已提交审核，请等待管理员处理',
        });
        this.setData({ showQRCode: false });
        return;
      }

      if (data && data.fileID) {
        this.setData({
          showQRCode: true,
          myQRCodeUrl: data.fileID,
        });
      } else {
        throw new Error('生成失败');
      }
    } catch (err) {
      console.error(err);

      Toast({
        context: this,
        selector: '#t-toast',
        message: '生成失败，请重试',
      });

      // 失败时关闭弹窗，方便用户重试
      this.setData({ showQRCode: false });
    } finally {
      wx.hideLoading();
    }
  },

  handleCloseQRCode() {
    this.setData({ showQRCode: false });
  },

  handleOrderNav(e) {
    const orderStatus = e.detail.orderStatus;

    if (orderStatus === 'AFTER_SERVICE') {
      wx.navigateTo({ url: '/pages/order/after-service-list/index' });
    } else {
      wx.navigateTo({ url: `/pages/order/order-list/index?currentStatus=${orderStatus}` });
    }
  },

  handleAllOrderNav() {
    wx.navigateTo({ url: '/pages/order/order-list/index' });
  },

  handleOpenMakePhone() {
    if (!this.data.customerServiceInfo.servicePhone && !this.data.showKefu) {
      Toast({ context: this, selector: '#t-toast', message: '当前版本未配置客服入口' });
      return;
    }
    this.setData({ showMakePhone: true });
  },

  handleCloseMakePhone() {
    this.setData({ showMakePhone: false });
  },

  handleCall() {
    if (!this.data.customerServiceInfo.servicePhone) {
      Toast({ context: this, selector: '#t-toast', message: '当前版本未配置客服电话' });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: this.data.customerServiceInfo.servicePhone,
    });
  },

  getLocalVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    // Default to 'develop' if envVersion is not available (rare)
    const { version, envVersion = 'develop' } = versionInfo.miniProgram;
    this.setData({
      versionNo: envVersion === 'release' ? version : envVersion,
    });
  },
});
