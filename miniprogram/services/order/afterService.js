import { ServiceButtonTypes, AfterServiceStatus, ServiceType } from './orderConfig';

function getCurrentOpenId() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  if (!userInfo._openid) {
    throw new Error('用户未登录');
  }
  return userInfo._openid;
}

/**
 * Fetch After Service List
 * @param {object} params - { page, pageSize, status }
 */
export async function fetchServiceList(params = {}) {
  const { page = 1, pageSize = 10, status = -1 } = params;
  const openId = getCurrentOpenId();
  const db = wx.cloud.database();
  const query = {
    _openid: openId,
  };

  if (status !== undefined && status !== -1) {
    query.status = Number(status);
  }

  try {
    const countResult = await db.collection('after-service').where(query).count();
    const listResult = await db
      .collection('after-service')
      .where(query)
      .orderBy('createdAt', 'desc')
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize))
      .get();

    return {
      list: listResult.data || [],
      total: countResult.total || 0,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  } catch (err) {
    console.error('fetchServiceList error', err);
    throw err;
  }
}

/**
 * Fetch After Service Detail
 * @param {string} rightsNo
 */
export async function fetchServiceDetail(rightsNo, id = '') {
  if (!rightsNo && !id) {
    throw new Error('Missing rightsNo or id');
  }

  const openId = getCurrentOpenId();
  const db = wx.cloud.database();
  const query = { _openid: openId };
  if (rightsNo) query.rightsNo = rightsNo;
  if (id) query._id = id;

  try {
    const res = await db.collection('after-service').where(query).limit(1).get();
    if (!res.data || res.data.length === 0) {
      throw new Error('After service order not found');
    }
    return res.data[0];
  } catch (err) {
    console.error('fetchServiceDetail error', err);
    throw err;
  }
}

/**
 * Cancel After Service
 * @param {string} rightsNo
 */
export function cancelService(rightsNo) {
  if (!rightsNo) return Promise.reject(new Error('Missing rightsNo'));
  return wx.cloud
    .callFunction({
      name: 'manageAfterService',
      data: {
        action: 'cancel',
        payload: { rightsNo },
      },
    })
    .then((res) => {
      if (res.result && res.result.success) {
        return res.result.data || {};
      }
      throw new Error((res.result && res.result.message) || 'Cancel failed');
    });
}

/**
 * Get After Service Buttons based on status and type
 * @param {object} service - The service object (status, type, logisticsNo)
 */
export function getAfterServiceButtons(service) {
  console.log('getAfterServiceButtons:', service);

  const buttons = [];
  const { logisticsNo } = service;
  const status = Number(service.status);
  const type = Number(service.type);

  if (status === AfterServiceStatus.TO_AUDIT) {
    buttons.push({
      type: ServiceButtonTypes.REVOKE,
      name: '撤销申请',
      primary: false,
    });
  }

  if (status === AfterServiceStatus.THE_APPROVED) {
    if (type === ServiceType.RETURN_GOODS && !logisticsNo) {
      buttons.push({
        type: ServiceButtonTypes.FILL_TRACKING_NO,
        name: '填写运单号',
        primary: true,
      });
    }
  }

  if (
    [
      AfterServiceStatus.HAVE_THE_GOODS,
      AfterServiceStatus.ABNORMAL_RECEIVING,
      AfterServiceStatus.COMPLETE,
    ].includes(status)
  ) {
    if (logisticsNo) {
      buttons.push({
        type: ServiceButtonTypes.VIEW_DELIVERY,
        name: '查看物流',
        primary: false,
      });
    }
  }

  if (status === AfterServiceStatus.THE_APPROVED && logisticsNo) {
    buttons.push({
      type: ServiceButtonTypes.CHANGE_TRACKING_NO,
      name: '修改运单号',
      primary: false,
    });
    buttons.push({
      type: ServiceButtonTypes.VIEW_DELIVERY,
      name: '查看物流',
      primary: false,
    });
  }

  return buttons;
}
