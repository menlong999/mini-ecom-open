const CLOUD_FUNCTION = 'adminManageReport';

function log(action, data) {
  console.log(`[reportMgr] ${action}`, data);
}

function logResult(action, res) {
  console.log(`[reportMgr] ${action}:result`, res && res.result ? res.result : res);
}

function logError(action, err) {
  console.error(`[reportMgr] ${action}:error`, err);
}

export async function fetchReportOverview() {
  log('overview', {});
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: { action: 'overview' },
    });
    logResult('overview', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || 'Fetch report failed');
  } catch (err) {
    logError('overview', err);
    throw err;
  }
}

export async function fetchDistributorOrders({ openid, page = 1, pageSize = 20 }) {
  log('distributorOrders', { openid, page, pageSize });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'distributorOrders',
        payload: { openid, page, pageSize },
      },
    });
    logResult('distributorOrders', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || 'Fetch orders failed');
  } catch (err) {
    logError('distributorOrders', err);
    throw err;
  }
}
