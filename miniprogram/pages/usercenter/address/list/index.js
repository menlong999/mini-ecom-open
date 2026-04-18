/* eslint-disable no-param-reassign */
import {
  fetchUserAddressList,
  deleteAddress,
  setDefaultAddress,
} from '../../../../services/address/address';
import Toast from 'tdesign-miniprogram/toast/index';
import { addressPicker, addressEditor } from '../../../../services/address/channel';

Page({
  data: {
    addressList: [],
    deleteID: '',
    showDeleteConfirm: false,
    isOrderSure: false,
    loading: false,
  },

  /** 选择模式 */
  selectMode: false,
  /** 是否已经选择地址 */
  hasSelect: false,

  onLoad(query) {
    const { selectMode = '', isOrderSure = '', id = '' } = query;
    this.setData({
      isOrderSure: !!isOrderSure,
      id,
    });
    this.selectMode = !!selectMode;
    this.init();
  },

  async init() {
    await this.fetchAddressList();
  },

  onUnload() {
    if (this.selectMode && !this.hasSelect) {
      addressPicker.reject();
    }
  },

  async fetchAddressList() {
    try {
      this.setData({ loading: true });

      const openId = wx.getStorageSync('userInfo')?._openid;
      const addressList = await fetchUserAddressList(openId);

      // 标记选中的地址
      const { id } = this.data;
      if (id) {
        addressList.forEach((address) => {
          if (address.id === id) {
            address.checked = true;
          }
        });
      }

      this.setData({
        addressList,
        loading: false,
      });
    } catch (error) {
      console.error('获取地址列表失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '获取地址列表失败',
        icon: 'error-circle',
        duration: 2000,
      });
      this.setData({ loading: false });
    }
  },

  // 微信地址选择
  handleWXAddress() {
    wx.chooseAddress({
      success: (res) => {
        if (res.errMsg.indexOf('ok') === -1) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: res.errMsg,
            icon: 'error-circle',
            duration: 2000,
          });
          return;
        }

        // 跳转到编辑页面，预填微信地址数据
        const addressData = {
          name: res.userName,
          phone: res.telNumber,
          provinceName: res.provinceName,
          cityName: res.cityName,
          districtName: res.countryName,
          detailAddress: res.detailInfo,
          addressTag: '微信地址',
        };

        // 注册 promise 监听，等待编辑页保存完成后刷新列表
        this.waitForNewAddress();

        wx.setStorageSync('wxAddressData', addressData);
        wx.navigateTo({
          url: '/pages/usercenter/address/edit/index?fromWX=1',
        });
      },
      fail: (error) => {
        console.error('获取微信地址失败:', error);
        Toast({
          context: this,
          selector: '#t-toast',
          message: '获取微信地址失败',
          icon: 'error-circle',
          duration: 2000,
        });
      },
    });
  },

  // 确认删除
  handleDeleteConfirm({ detail }) {
    const { id } = detail || {};
    console.log('确认删除地址ID:', id);
    if (id) {
      this.setData({
        deleteID: id,
        showDeleteConfirm: true,
      });
    } else {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '删除操作异常',
        icon: 'error-circle',
        duration: 2000,
      });
    }
  },

  // 执行删除
  async handleDeleteAddress(e) {
    try {
      const { id } = e.currentTarget.dataset;
      // 从事件参数获取ID，如果没有则使用数据中的deleteID
      const addressId = id;
      if (!addressId) return;

      // 弹出确认框，避免误删除
      wx.showModal({
        title: '确认删除',
        content: '确定要删除此地址吗？',
        success: async (res) => {
          if (res.confirm) {
            // 用户点击确定，执行删除
            this.setData({ loading: true });

            try {
              await deleteAddress(addressId);

              // 从列表中移除
              const newAddressList = this.data.addressList.filter(
                (address) => address.id !== addressId
              );

              this.setData({
                addressList: newAddressList,
                deleteID: '',
                showDeleteConfirm: false,
                loading: false,
              });

              Toast({
                context: this,
                selector: '#t-toast',
                message: '地址删除成功',
                icon: 'check-circle',
                duration: 2000,
              });
            } catch (error) {
              console.error('删除地址失败:', error);
              Toast({
                context: this,
                selector: '#t-toast',
                message: '删除地址失败',
                icon: 'error-circle',
                duration: 2000,
              });
              this.setData({ loading: false });
            }
          }
        },
      });
    } catch (error) {
      console.error('删除地址操作失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '删除操作失败',
        icon: 'error-circle',
        duration: 2000,
      });
    }
  },

  // 取消删除
  handleDeleteCancel() {
    this.setData({
      deleteID: '',
      showDeleteConfirm: false,
    });
  },

  // 编辑地址
  handleAddressEdit(e) {
    this.waitForNewAddress();
    const { id } = e.currentTarget.dataset;
    if (id) {
      wx.navigateTo({
        url: `/pages/usercenter/address/edit/index?id=${id}`,
      });
    }
  },

  // 选择地址
  async handleAddressSelect(e) {
    try {
      const item = e.currentTarget.dataset.item;
      if (!item) return;

      if (this.selectMode) {
        // 选择模式：选中地址并返回
        this.hasSelect = true;
        wx.setStorageSync('selectedAddress', item);
        addressPicker.resolve(item);
        wx.navigateBack({ delta: 1 });
      } else {
        // 普通模式：跳转编辑
        this.handleAddressEdit({ currentTarget: { dataset: { id: item.id } } });
      }
    } catch (error) {
      console.error('选择地址失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '选择地址失败',
        icon: 'error-circle',
        duration: 2000,
      });
    }
  },

  // 设置默认地址
  async handleSetDefault({ detail }) {
    try {
      const { id } = detail || {};
      if (!id) return;

      await setDefaultAddress(id);

      // 刷新地址列表
      await this.fetchAddressList();

      Toast({
        context: this,
        selector: '#t-toast',
        message: '已设为默认地址',
        icon: 'check-circle',
        duration: 2000,
      });
    } catch (error) {
      console.error('设置默认地址失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '设置默认地址失败',
        icon: 'error-circle',
        duration: 2000,
      });
    }
  },

  // 创建新地址
  handleAddressCreate() {
    this.waitForNewAddress();
    wx.navigateTo({
      url: '/pages/usercenter/address/edit/index',
    });
  },

  // 等待新地址创建或编辑完成
  waitForNewAddress() {
    addressEditor
      .getPromise()
      .then(async (result) => {
        // 刷新地址列表
        await this.fetchAddressList();

        Toast({
          context: this,
          selector: '#t-toast',
          message: result.isEdit ? '地址更新成功' : '地址创建成功',
          icon: 'check-circle',
          duration: 2000,
        });
      })
      .catch((error) => {
        if (error.message !== 'cancel') {
          console.error('地址操作失败:', error);
          Toast({
            context: this,
            selector: '#t-toast',
            message: '地址操作失败',
            icon: 'error-circle',
            duration: 2000,
          });
        }
      });
  },
});
