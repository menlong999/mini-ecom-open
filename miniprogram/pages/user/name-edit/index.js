import { updateUserInfo } from '../../../services/usercenter/fetchUsercenter';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    nameValue: '',
  },
  onLoad(options) {
    const { name } = options;
    this.setData({
      nameValue: name || '',
    });
  },
  async handleSave() {
    const nickName = this.data.nameValue.trim();
    if (!nickName) {
      Toast({ context: this, selector: '#t-toast', message: '昵称不能为空' });
      return;
    }

    wx.showLoading({ title: '保存中' });

    try {
      // 1. 更新本地缓存
      const userInfo = wx.getStorageSync('userInfo') || {};
      const newUserInfo = { ...userInfo, nickName };
      wx.setStorageSync('userInfo', newUserInfo);

      // 2. 更新到云数据库
      await updateUserInfo();

      wx.hideLoading();
      Toast({ context: this, selector: '#t-toast', message: '保存成功' });

      // 3. 返回上一页
      setTimeout(() => {
        wx.navigateBack({ delta: 1 });
      }, 1000);
    } catch (err) {
      wx.hideLoading();
      console.error('保存昵称失败', err);
      Toast({ context: this, selector: '#t-toast', message: '保存失败，请重试' });
    }
  },
  handleClearInput() {
    this.setData({
      nameValue: '',
    });
  },
});
