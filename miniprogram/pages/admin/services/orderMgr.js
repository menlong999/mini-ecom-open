const CLOUD_FUNCTION = 'adminManageOrder';

function log(action, data) {
  console.log(`[orderMgr] ${action}`, data);
}

function logResult(action, res) {
  console.log(`[orderMgr] ${action}:result`, res && res.result ? res.result : res);
}

function logError(action, err) {
  console.error(`[orderMgr] ${action}:error`, err);
}

export async function fetchAdminOrders({ page = 1, pageSize = 20, status = 'ALL', keyword = '' }) {
  log('fetchAdminOrders', { page, pageSize, status, keyword });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'list',
        payload: { page, pageSize, status, keyword },
      },
    });
    logResult('fetchAdminOrders', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || 'Fetch list failed');
  } catch (err) {
    logError('fetchAdminOrders', err);
    throw err;
  }
}

export async function fetchAdminOrderDetail(orderId) {
  log('fetchAdminOrderDetail', { orderId });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'detail',
        payload: { orderId },
      },
    });
    logResult('fetchAdminOrderDetail', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || 'Fetch detail failed');
  } catch (err) {
    logError('fetchAdminOrderDetail', err);
    throw err;
  }
}

export async function shipOrder(payload) {
  log('shipOrder', payload);
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'ship',
        payload,
      },
    });
    logResult('shipOrder', res);
    if (res.result && res.result.success) {
      return true;
    }
    throw new Error((res.result && res.result.message) || 'Ship failed');
  } catch (err) {
    logError('shipOrder', err);
    throw err;
  }
}

export async function updateOrderLogistics(payload) {
  log('updateOrderLogistics', payload);
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'updateLogistics',
        payload,
      },
    });
    logResult('updateOrderLogistics', res);
    if (res.result && res.result.success) {
      return true;
    }
    throw new Error((res.result && res.result.message) || 'Update logistics failed');
  } catch (err) {
    logError('updateOrderLogistics', err);
    throw err;
  }
}

export async function confirmPickup(payload) {
  log('confirmPickup', payload);
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'confirmPickup',
        payload,
      },
    });
    logResult('confirmPickup', res);
    if (res.result && res.result.success) {
      return true;
    }
    throw new Error((res.result && res.result.message) || 'Confirm pickup failed');
  } catch (err) {
    logError('confirmPickup', err);
    throw err;
  }
}
