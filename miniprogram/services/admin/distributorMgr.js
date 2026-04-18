const CLOUD_FUNCTION = 'adminManageDistributor';

function log(action, data) {
  console.log(`[distributorMgr] ${action}`, data);
}

function logResult(action, res) {
  console.log(`[distributorMgr] ${action}:result`, res && res.result ? res.result : res);
}

function logError(action, err) {
  console.error(`[distributorMgr] ${action}:error`, err);
}

export async function fetchDistributorList({
  page = 1,
  pageSize = 20,
  status = 'ALL',
  keyword = '',
}) {
  log('fetchDistributorList', { page, pageSize, status, keyword });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'list',
        payload: { page, pageSize, status, keyword },
      },
    });
    logResult('fetchDistributorList', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || 'Fetch list failed');
  } catch (err) {
    logError('fetchDistributorList', err);
    throw err;
  }
}

export async function approveDistributor(openid) {
  return callAction('approve', { openid }, 'Approve failed');
}

export async function rejectDistributor(openid, reason = '') {
  return callAction('reject', { openid, reason }, 'Reject failed');
}

async function callAction(action, payload, defaultMsg) {
  log(action, payload);
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: { action, payload },
    });
    logResult(action, res);
    if (res.result && res.result.success) {
      return true;
    }
    throw new Error((res.result && res.result.message) || defaultMsg);
  } catch (err) {
    logError(action, err);
    throw err;
  }
}
