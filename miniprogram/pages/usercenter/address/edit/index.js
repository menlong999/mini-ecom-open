import {
  fetchAddressById,
  createAddress,
  updateAddress,
} from '../../../../services/address/address';
import Toast from 'tdesign-miniprogram/toast/index';
import { addressEditor } from '../../../../services/address/channel';
import { areaData } from '../../../../utils/areaData'; // 从独立的地理数据文件中导入

Page({
  data: {
    // 地址状态
    editingAddress: {
      name: '',
      phone: '',
      provinceName: '',
      provinceCode: '',
      cityName: '',
      cityCode: '',
      districtName: '',
      districtCode: '',
      detailAddress: '',
      addressTag: '家',
      isDefault: false,
      labelIndex: 0, // 选中的标签索引
    },
    // 原始数据结构
    originalAddress: {
      name: '',
      phone: '',
      provinceName: '',
      provinceCode: '',
      cityName: '',
      cityCode: '',
      districtName: '',
      districtCode: '',
      detailAddress: '',
      addressTag: '家',
      isDefault: false,
      labelIndex: 0,
    },
    // 标签列表
    labels: [
      { name: '家' },
      { name: '公司' },
      { name: '学校' },
      { name: '微信地址' },
      { name: '其他' },
    ],
    // UI 状态
    areaPickerVisible: false, // 地区选择器可见状态
    areaData: areaData || [], // 地区数据
    submitActive: true, // 提交按钮激活状态
    visible: false, // 对话框可见状态
    labelValue: '', // 标签输入值
    isEdit: false,
    addressId: '',
    loading: false,
    submitting: false,
  },

  onLoad(options) {
    const { id = '', fromWX = '' } = options;

    this.setData({
      isEdit: !!id,
      addressId: id,
    });

    if (id) {
      // 编辑模式：加载地址数据
      this.loadAddressData(id);
    } else if (fromWX === '1') {
      // 从微信地址添加
      this.loadWXAddressData();
    }

    // 监听表单字段变化，更新提交按钮状态
    this.updateSubmitStatus();
  },

  onUnload() {
    // 页面卸载时取消地址编辑
    addressEditor.reject();
  },

  // 加载地址数据
  async loadAddressData(addressId) {
    try {
      this.setData({ loading: true });

      const addressData = await fetchAddressById(addressId);
      if (addressData) {
        // 存储原始数据，不要修改它
        const originalData = {
          name: addressData.name || '',
          phone: addressData.phone || '',
          provinceName: addressData.provinceName || '',
          provinceCode: addressData.provinceCode || '',
          cityName: addressData.cityName || '',
          cityCode: addressData.cityCode || '',
          districtName: addressData.districtName || '',
          districtCode: addressData.districtCode || '',
          detailAddress: addressData.detailAddress || '',
          addressTag: addressData.addressTag || '家',
          isDefault: addressData.isDefault === 1,
        };

        // 找到标签索引
        const labelIndex = this.data.labels.findIndex(
          (label) => label.name === originalData.addressTag
        );

        this.setData({
          originalAddress: originalData,
          editingAddress: {
            ...originalData,
            labelIndex: labelIndex >= 0 ? labelIndex : 0,
          },
          loading: false,
          // 初始时禁用提交按钮，直到有变更
          submitActive: false,
        });
      } else {
        throw new Error('地址不存在');
      }
    } catch (error) {
      console.error('加载地址数据失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '加载地址数据失败',
        icon: 'error-circle',
        duration: 2000,
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  // 加载微信地址数据
  loadWXAddressData() {
    const wxAddressData = wx.getStorageSync('wxAddressData');
    if (wxAddressData) {
      // 找到标签索引
      const labelIndex = this.data.labels.findIndex(
        (label) => label.name === wxAddressData.addressTag
      );
      const addressData = {
        ...this.data.originalAddress,
        name: wxAddressData.name || '',
        phone: wxAddressData.phone || '',
        provinceName: wxAddressData.provinceName || '',
        cityName: wxAddressData.cityName || '',
        districtName: wxAddressData.districtName || '',
        detailAddress: wxAddressData.detailAddress || '',
        labelIndex: labelIndex >= 0 ? labelIndex : 0,
      };

      this.setData({
        originalAddress: addressData,
        editingAddress: addressData,
      });

      wx.removeStorageSync('wxAddressData');
    }
  },

  // 统一的输入处理函数 (WXML 中绑定的 handleFormInput)
  handleFormInput(e) {
    const { item, type } = e.currentTarget.dataset || {};
    const value = e.detail.value !== undefined ? e.detail.value : e.detail;

    console.log('级联选择器数据:', e.detail); // 调试用

    if (item === 'address' && type === '1') {
      // 地区选择器的选择结果
      if (Array.isArray(value) && value.length === 3) {
        // 标准级联选择器结果格式
        const [province, city, district] = value;

        this.setData({
          'editingAddress.provinceName': province.name || '',
          'editingAddress.provinceCode': province.value || '',
          'editingAddress.cityName': city.name || '',
          'editingAddress.cityCode': city.value || '',
          'editingAddress.districtName': district.name || '',
          'editingAddress.districtCode': district.value || '',
          areaPickerVisible: false,
        });

        // 注意：不要更新 originalAddress，它是原始数据用于变更检测
      } else {
        // TDesign 级联选择器可能是其他格式
        // 尝试通过选择项提取数据
        const selectedItems = e.detail.selectedOptions || [];

        if (selectedItems.length >= 3) {
          const province = selectedItems[0] || {};
          const city = selectedItems[1] || {};
          const district = selectedItems[2] || {};

          this.setData({
            'editingAddress.provinceName': province.name || province.label || '',
            'editingAddress.provinceCode': province.value || '',
            'editingAddress.cityName': city.name || city.label || '',
            'editingAddress.cityCode': city.value || '',
            'editingAddress.districtName': district.name || district.label || '',
            'editingAddress.districtCode': district.value || '',
            areaPickerVisible: false,
          });

          // 注意：不要更新 originalAddress，它是原始数据用于变更检测
        }
      }

      // 不管处理成功与否，隐藏选择器
      this.setData({ areaPickerVisible: false });

      // 更新提交按钮状态
      this.updateSubmitStatus();
    } else if (item) {
      // 只更新 editingAddress，不要更新 originalAddress（它是原始数据用于变更检测）
      this.setData({
        [`editingAddress.${item}`]: value,
      });
      this.updateSubmitStatus();
    }
  },

  // 地区选择 (WXML 中绑定的 openAreaPicker)
  openAreaPicker() {
    this.setData({
      areaPickerVisible: true,
    });
  },

  // 地址搜索 (WXML 中绑定的 openLocationPicker)
  openLocationPicker() {
    wx.chooseLocation({
      success: (res) => {
        const { name, address } = res;
        const detailAddress = name || address || '';

        this.setData({
          'editingAddress.detailAddress': detailAddress,
          'originalAddress.detailAddress': detailAddress,
        });

        this.updateSubmitStatus();
      },
      fail: (err) => {
        if (err.errMsg !== 'chooseLocation:fail cancel') {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '获取位置失败',
            icon: 'error-circle',
          });
        }
      },
    });
  },

  // 获取微信地址 (WXML 中绑定的 handleWxAddress)
  // 此方法是 edit/index.wxml 中的 wx-address-import 组件的点击事件
  handleWxAddress() {
    wx.chooseAddress({
      success: (res) => {
        if (res.errMsg.indexOf('ok') === -1) return;

        const labelIndex = this.data.labels.findIndex((label) => label.name === '微信地址');

        const editingAddress = {
          name: res.userName || '',
          phone: res.telNumber || '',
          provinceName: res.provinceName || '',
          provinceCode: '',
          cityName: res.cityName || '',
          cityCode: '',
          districtName: res.countryName || '',
          districtCode: '',
          detailAddress: res.detailInfo || '',
          addressTag: '微信地址',
          labelIndex: labelIndex >= 0 ? labelIndex : 0,
          isDefault: false,
        };

        this.setData({
          editingAddress,
          // 注意：不要更新 originalAddress！
          // 导入微信地址是新建场景，originalAddress 保持空，这样 requiredFieldsValid 即可启用保存
          // 保持 isEdit = false，这样保存时会调用 createAddress 而不是 updateAddress
        });

        this.updateSubmitStatus();
      },
      fail: (err) => {
        if (
          err.errMsg !== 'chooseAddress:fail auth deny' &&
          err.errMsg !== 'chooseAddress:fail cancel'
        ) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '获取微信地址失败',
            icon: 'error-circle',
          });
        }
      },
    });
  },

  // 标签选择 (WXML 中绑定的 handleLabelSelect)
  handleLabelSelect(e) {
    const { item } = e.currentTarget.dataset;
    const addressTag = this.data.labels[item].name;

    this.setData({
      'editingAddress.labelIndex': item,
      'editingAddress.addressTag': addressTag,
      // 'originalAddress.addressTag': addressTag
    });

    // 添加此行，确保更新按钮状态
    this.updateSubmitStatus();
  },

  // 添加自定义标签 (WXML 中绑定的 openAddLabelDialog)
  openAddLabelDialog() {
    this.setData({
      visible: true,
      labelValue: '',
    });
  },

  // 确认添加标签
  handleLabelConfirm() {
    const { labelValue } = this.data;

    if (!labelValue.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '标签名称不能为空',
        icon: 'error-circle',
      });
      return;
    }

    // 添加新标签
    const labels = [...this.data.labels];
    labels.push({ name: labelValue.trim() });

    // 选中新添加的标签
    const labelIndex = labels.length - 1;

    this.setData({
      labels,
      'editingAddress.labelIndex': labelIndex,
      'editingAddress.addressTag': labelValue.trim(),
      'originalAddress.addressTag': labelValue.trim(),
      visible: false,
    });
  },

  // 取消添加标签
  handleLabelCancel() {
    this.setData({
      visible: false,
    });
  },

  // 设置默认地址 (WXML 中绑定的 handleDefaultToggle)
  handleDefaultToggle(e) {
    const isDefault = e.detail.value;

    this.setData({
      'editingAddress.isDefault': isDefault,
      // 'originalAddress.isDefault': isDefault
    });

    // 添加此行，确保更新按钮状态
    this.updateSubmitStatus();
  },

  // 表单提交 (WXML 中绑定的 handleFormSubmit)
  async handleFormSubmit() {
    if (!this.validateForm()) {
      return;
    }

    if (this.data.submitting) {
      return;
    }

    try {
      this.setData({ submitting: true });

      const { isEdit, addressId, editingAddress } = this.data;

      // 使用editingAddress中的最新数据构建提交对象
      const submitData = {
        name: editingAddress.name,
        phone: editingAddress.phone,
        provinceName: editingAddress.provinceName,
        provinceCode: editingAddress.provinceCode,
        cityName: editingAddress.cityName,
        cityCode: editingAddress.cityCode,
        districtName: editingAddress.districtName,
        districtCode: editingAddress.districtCode,
        detailAddress: editingAddress.detailAddress,
        addressTag: editingAddress.addressTag,
        isDefault: editingAddress.isDefault,
      };

      if (isEdit) {
        // 更新地址
        await updateAddress(addressId, submitData);
      } else {
        // 创建地址
        await createAddress(submitData);
      }

      // 通知地址列表页面刷新
      addressEditor.resolve({
        isEdit,
        addressData: submitData, // 使用最新数据
      });

      Toast({
        context: this,
        selector: '#t-toast',
        message: isEdit ? '地址更新成功' : '地址保存成功',
        icon: 'check-circle',
        duration: 1500,
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存地址失败:', error);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '保存地址失败',
        icon: 'error-circle',
        duration: 2000,
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 表单验证
  validateForm() {
    const { editingAddress } = this.data;

    if (!editingAddress.name.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入收件人姓名',
        icon: 'error-circle',
      });
      return false;
    }

    if (!editingAddress.phone.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入手机号码',
        icon: 'error-circle',
      });
      return false;
    }

    // 手机号格式验证
    if (!/^1[3-9]\d{9}$/.test(editingAddress.phone)) {
      console.warn('手机号格式不正确:', editingAddress.phone, editingAddress.phone.length);
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入正确的手机号码',
        icon: 'error-circle',
      });
      return false;
    }

    if (!editingAddress.provinceName || !editingAddress.cityName || !editingAddress.districtName) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择所在地区',
        icon: 'error-circle',
      });
      return false;
    }

    if (!editingAddress.detailAddress.trim()) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入详细地址',
        icon: 'error-circle',
      });
      return false;
    }

    return true;
  },

  // 更新提交按钮状态
  updateSubmitStatus() {
    const { editingAddress, isEdit, originalAddress } = this.data;

    // 必填字段验证
    const requiredFieldsValid = !!(
      editingAddress.name &&
      editingAddress.phone &&
      editingAddress.provinceName &&
      editingAddress.cityName &&
      editingAddress.districtName &&
      editingAddress.detailAddress
    );

    console.log('updateSubmitStatus:', requiredFieldsValid, hasChanges, isEdit);

    // 编辑模式下检查是否有字段被修改
    let hasChanges = false;

    if (isEdit) {
      // 比较原始数据和当前数据是否有变化
      const originalData = {
        name: originalAddress.name,
        phone: originalAddress.phone,
        provinceName: originalAddress.provinceName,
        cityName: originalAddress.cityName,
        districtName: originalAddress.districtName,
        detailAddress: originalAddress.detailAddress,
        addressTag: originalAddress.addressTag,
        isDefault: originalAddress.isDefault,
      };

      const currentData = {
        name: editingAddress.name,
        phone: editingAddress.phone,
        provinceName: editingAddress.provinceName,
        cityName: editingAddress.cityName,
        districtName: editingAddress.districtName,
        detailAddress: editingAddress.detailAddress,
        addressTag: editingAddress.addressTag,
        isDefault: editingAddress.isDefault,
      };

      console.log('原始数据:', originalData);
      console.log('当前数据:', currentData);

      // 检查任意字段是否有变化
      hasChanges = JSON.stringify(originalData) !== JSON.stringify(currentData);

      // 在编辑模式下，如果必填字段都有值并且有任何变化，则启用提交按钮
      this.setData({
        submitActive: requiredFieldsValid && hasChanges,
      });

      console.log('编辑状态检查:', {
        requiredFieldsValid,
        hasChanges,
        submitActive: requiredFieldsValid && hasChanges,
      });
    } else {
      // 新建模式下，只要必填字段都有值就启用提交按钮
      this.setData({ submitActive: requiredFieldsValid });
    }
  },

  // 级联选择器选择事件
  handleCascaderSelect(e) {
    console.log('级联选择器选择数据:', e.detail);
  },

  // 页面准备好时输出调试信息
  onReady() {
    console.log('区域数据:', this.data.areaData);
    console.log('当前表单数据:', this.data.originalAddress);
    console.log('当前地址状态:', this.data.editingAddress);
  },
});
