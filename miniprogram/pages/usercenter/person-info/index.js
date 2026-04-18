import { updateUserInfo } from '../../../services/usercenter/fetchUsercenter';
import { dispatchLogin } from '../../../services/common/login';
import { uploadFile } from '../../../services/common/upload';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  data: {
    personInfo: {
      avatarUrl: '',
      nickName: '',
      gender: 0,
      phoneNumber: '',
    },
    genderMap: ['不展示', '男', '女'],
    showUnbindConfirm: false,
    pickerOptions: [
      { name: '不展示', code: '0' },
      { name: '男', code: '1' },
      { name: '女', code: '2' },
    ],
    typeVisible: false,
  },

  onLoad() {
    this.loadPersonData();
  },

  loadPersonData() {
    // 从本地缓存同步最新数据 (已经在 usercenter/index 中更新过)
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({
      personInfo: userInfo,
    });
  },

  // 1. 处理头像选择 (微信开放能力)
  async handleChooseAvatar(e) {
    console.log('onChooseAvatar triggered', e);
    const { avatarUrl } = e.detail;

    if (!avatarUrl) {
      console.error('onChooseAvatar: No avatarUrl returned');
      return;
    }

    const { personInfo } = this.data;
    if (!personInfo || !personInfo._openid) {
      console.error('onChooseAvatar: Missing personInfo or _openid', personInfo);
      Toast({ context: this, selector: '#t-toast', message: '用户信息缺失，无法上传' });
      return;
    }

    // 动态获取文件扩展名，默认为 png
    const extMatch = avatarUrl.match(/\.[^.]+?$/);
    const ext = extMatch ? extMatch[0] : '.png';
    const cloudPath = `avatars/${personInfo._openid}-${Date.now()}${ext}`;

    console.log(`Ready to upload avatar. Source: ${avatarUrl}, Target: ${cloudPath}`);

    try {
      wx.showLoading({ title: '上传中...', mask: true });

      const uploadRes = await uploadFile(cloudPath, avatarUrl);
      console.log('Cloud upload success:', uploadRes);

      const newAvatarUrl = uploadRes.fileID;

      this.setData({
        'personInfo.avatarUrl': newAvatarUrl,
      });

      // 更新数据库
      console.log('Updating cloud database with new avatar...');
      await this.updateUserToCloud({ avatarUrl: newAvatarUrl });

      wx.hideLoading();
      Toast({ context: this, selector: '#t-toast', message: '头像修改成功', theme: 'success' });
    } catch (err) {
      console.error('onChooseAvatar failed:', err);
      wx.hideLoading();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '头像上传失败: ' + (err.errMsg || err.message || '请重试'),
      });
    }
  },

  // 2. 处理昵称编辑 (跳转到 name-edit 页面，那里应该处理 input type="nickname")
  handleCellClick({ currentTarget }) {
    const { dataset } = currentTarget;
    const { nickName } = this.data.personInfo;

    switch (dataset.type) {
      case 'gender':
        this.setData({ typeVisible: true });
        break;
      case 'name':
        wx.navigateTo({
          url: `/pages/usercenter/name-edit/index?name=${nickName || ''}`,
        });
        break;
      default:
        break;
    }
  },

  // 3. 处理手机号获取 (微信开放能力)
  async handleGetPhoneNumber(e) {
    const { code, errMsg } = e.detail;
    if (errMsg === 'getPhoneNumber:ok') {
      wx.showLoading({ title: '绑定中...' });

      try {
        // 调用 login 云函数模式2: 获取手机号
        const userData = await dispatchLogin({ phoneCode: code });

        if (userData && userData.phoneNumber) {
          const newPhone = userData.phoneNumber;
          this.setData({
            'personInfo.phoneNumber': newPhone,
          });

          // 更新本地缓存
          const currentUser = wx.getStorageSync('userInfo') || {};
          wx.setStorageSync('userInfo', { ...currentUser, phoneNumber: newPhone });

          Toast({
            context: this,
            selector: '#t-toast',
            message: '手机号绑定成功',
            theme: 'success',
          });
        } else {
          console.error('getPhoneNumber cloud error:', userData);
          throw new Error((userData && userData.message) || '获取失败');
        }
      } catch (err) {
        console.error('getPhoneNumber final error:', err);
        Toast({ context: this, selector: '#t-toast', message: err.message || '绑定失败，请重试' });
      } finally {
        wx.hideLoading();
      }
    } else {
      Toast({ context: this, selector: '#t-toast', message: '您取消了授权' });
    }
  },

  handleFilterPopupClose() {
    this.setData({ typeVisible: false });
  },

  handleFilterConfirm(e) {
    const { value } = e.detail;
    this.setData({
      typeVisible: false,
      'personInfo.gender': value,
    });
    this.updateUserToCloud({ gender: value });
  },

  // 辅助：更新用户信息到云数据库
  async updateUserToCloud(dataToUpdate) {
    const currentUser = wx.getStorageSync('userInfo');
    // 合并最新的
    const newUserInfo = { ...currentUser, ...dataToUpdate };
    wx.setStorageSync('userInfo', newUserInfo);

    // 调用 usercenter service 里的更新方法 (需确保 updateUserInfo 实现正确)
    // 这里简化直接用 cloudModels (如果文件里引不到 updateUserInfo)
    // 实际项目中建议复用 service
    try {
      await updateUserInfo(); // 触发 service 中的更新(读取本地缓存更新到db)
    } catch (e) {
      console.error('Update cloud failed', e);
    }
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.navigateBack();
        }
      },
    });
  },
});
