const app = getApp();

/**
 * 获取用户地址列表
 * @param {string} openId 用户ID
 * @returns {Promise<Array>} 地址列表
 */
export async function fetchUserAddressList(openId) {
  try {
    const res = await app.cloudModels.address.list({
      filter: {
        where: {
          $and: [{ _openid: { $eq: openId } }, { isValid: { $eq: true } }],
        },
        orderBy: [
          { isDefault: 'desc' }, // 默认地址排在前面
          { updatedAt: 'desc' }, // 按更新时间倒序
        ],
      },
    });

    if (res?.data?.records) {
      return res.data.records.map(formatAddressData);
    }
    return [];
  } catch (error) {
    console.error('获取地址列表失败:', error);
    throw error;
  }
}

/**
 * 根据ID获取地址详情
 * @param {string} addressId 地址ID
 * @returns {Promise<Object>} 地址详情
 */
export async function fetchAddressById(addressId) {
  try {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo._openid) {
      throw new Error('用户未登录');
    }

    const res = await app.cloudModels.address.list({
      filter: {
        where: {
          $and: [
            { _id: { $eq: addressId } },
            { _openid: { $eq: userInfo._openid } },
            { isValid: { $eq: true } },
          ],
        },
      },
    });

    if (res?.data?.records?.length > 0) {
      return formatAddressData(res.data.records[0]);
    }
    return null;
  } catch (error) {
    console.error('获取地址详情失败:', error);
    throw error;
  }
}

/**
 * 创建新地址
 * @param {Object} addressData 地址数据
 * @returns {Promise<Object>} 创建结果
 */
export async function createAddress(addressData) {
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageAddress',
      data: {
        action: 'add',
        payload: addressData,
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error(res.result?.message || '创建地址失败');
    }

    return res.result;
  } catch (error) {
    console.error('创建地址失败:', error);
    throw error;
  }
}

/**
 * 更新地址
 * @param {string} addressId 地址ID
 * @param {Object} addressData 地址数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateAddress(addressId, addressData) {
  console.log('update address: %s, %o', addressId, addressData);
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageAddress',
      data: {
        action: 'update',
        payload: {
          _id: addressId,
          addressData,
        },
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error(res.result?.message || '更新地址失败');
    }

    return res.result;
  } catch (error) {
    console.error('更新地址失败:', error);
    throw error;
  }
}

/**
 * 删除地址（软删除）
 * @param {string} addressId 地址ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteAddress(openId, addressId) {
  try {
    console.log('delete address: %s, %s', openId, addressId);

    const res = await wx.cloud.callFunction({
      name: 'manageAddress',
      data: {
        action: 'delete',
        payload: { _id: addressId },
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error(res.result?.message || '删除地址失败');
    }

    return res.result;
  } catch (error) {
    console.error('删除地址失败:', error);
    throw error;
  }
}

/**
 * 设置默认地址
 * @param {string} addressId 地址ID
 * @returns {Promise<Object>} 设置结果
 */
export async function setDefaultAddress(openId, addressId) {
  try {
    const res = await wx.cloud.callFunction({
      name: 'manageAddress',
      data: {
        action: 'setDefault',
        payload: { _id: addressId },
      },
    });

    if (!res.result || !res.result.success) {
      throw new Error(res.result?.message || '设置默认地址失败');
    }

    return res.result;
  } catch (error) {
    console.error('设置默认地址失败:', error);
    throw error;
  }
}

/**
 * 获取默认地址
 * @param {string} openId 用户ID
 * @returns {Promise<Object|null>} 默认地址
 */
export async function getDefaultAddress(openId) {
  try {
    const res = await app.cloudModels.address.list({
      filter: {
        where: {
          $and: [
            { _openid: { $eq: openId } },
            { isDefault: { $eq: true } },
            { isValid: { $eq: true } },
          ],
        },
      },
    });

    if (res?.data?.records?.length > 0) {
      return formatAddressData(res.data.records[0]);
    }
    return null;
  } catch (error) {
    console.error('获取默认地址失败:', error);
    throw error;
  }
}

/**
 * 更新默认地址状态
 * @param {string} openId 用户ID
 * @param {string} excludeId 排除的地址ID（不需要取消默认的地址）
 */
// function updateDefaultAddress(openId, excludeId) { ... } // Removed

/**
 * 格式化地址数据
 * @param {Object} rawData 原始地址数据
 * @returns {Object} 格式化后的地址数据
 */
function formatAddressData(rawData) {
  return {
    id: rawData._id,
    addressId: rawData._id,
    name: rawData.name,
    phone: rawData.phone,
    phoneNumber: rawData.phone, // 兼容字段
    provinceName: rawData.provinceName,
    provinceCode: rawData.provinceCode,
    cityName: rawData.cityName,
    cityCode: rawData.cityCode,
    districtName: rawData.districtName,
    districtCode: rawData.districtCode,
    detailAddress: rawData.detailAddress,
    fullAddress: rawData.fullAddress,
    address: rawData.fullAddress, // 兼容字段
    addressTag: rawData.addressTag,
    tag: rawData.addressTag, // 兼容字段
    isDefault: rawData.isDefault ? 1 : 0, // 转换为数字格式
    isValid: rawData.isValid,
    createTime: rawData.createdAt || rawData.createTime, // 优先使用 createdAt
    updateTime: rawData.updatedAt || rawData.updateTime,
  };
}
