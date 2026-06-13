import updateManager from './utils/updateManager';
import { runtimeConfig } from './config/index';
import { dispatchLogin } from './services/common/login';
// 引入主包共享依赖以消除“主包内未使用JS文件”警告
import './services/address/address';
import './services/address/channel';
import './services/common/upload';
import './services/order/logistics';
import './utils/orderHelper';
import './utils/uploadHelper';
import './utils/util';
const { initHTTPOverCallFunction } = require('./utils/wxCloudClientSDK.umd.js');

App({
  onLaunch: function (options) {
    const envId = runtimeConfig.cloud.envId;
    if (envId) {
      wx.cloud.init({ env: envId, traceUser: true });
    } else {
      wx.cloud.init({ traceUser: true });
      console.warn('[app] cloud env is not configured, using default environment resolution');
    }
    // 自动挂载 env 到 wx.cloud.config，兼容 wxCloudClientSDK 取 env
    if (!wx.cloud.config) wx.cloud.config = {};
    if (envId) {
      wx.cloud.config.env = envId;
    }

    const client = initHTTPOverCallFunction(wx.cloud);
    this.cloudModels = client.models;

    const { referrerOpenid, referrerScene } = this.parseReferrerScene(options);
    if (referrerOpenid) {
      wx.setStorageSync('referrerOpenid', referrerOpenid);
      wx.setStorageSync('referrerScene', referrerScene || '');
      this.globalData = this.globalData || {};
      this.globalData.referrerOpenid = referrerOpenid;
      this.globalData.referrerScene = referrerScene || '';
      this.tryUpdateReferrer(referrerOpenid, referrerScene || '');
    }
  },
  onShow: function () {
    updateManager();
  },

  parseReferrerScene(options = {}) {
    const rawScene = options && options.scene ? decodeURIComponent(options.scene) : '';
    if (!rawScene) return { referrerOpenid: '', referrerScene: '' };

    let referrerOpenid = '';
    if (rawScene.includes('=')) {
      const parts = rawScene.split('&');
      parts.forEach((part) => {
        const [key, value] = part.split('=');
        if (key === 'd' && value) referrerOpenid = value;
      });
    } else {
      referrerOpenid = rawScene;
    }

    return { referrerOpenid, referrerScene: rawScene };
  },

  tryUpdateReferrer(referrerOpenid, referrerScene) {
    if (!referrerOpenid) return;
    dispatchLogin({ referrerOpenid, referrerScene }).catch((err) => {
      console.warn('[app] update referrer failed:', err);
    });
  },
});
