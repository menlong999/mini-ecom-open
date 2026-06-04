const CLOUD_FUNCTION = 'adminManageAfterService';

function log(action, data) {
  console.log(`[afterServiceMgr] ${action}`, data);
}

function logResult(action, res) {
  console.log(`[afterServiceMgr] ${action}:result`, res && res.result ? res.result : res);
}

function logError(action, err) {
  console.error(`[afterServiceMgr] ${action}:error`, err);
}

export async function fetchAdminAfterServices({
  page = 1,
  pageSize = 20,
  status = 'ALL',
  keyword = '',
}) {
  log('fetchAdminAfterServices', { page, pageSize, status, keyword });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'list',
        payload: { page, pageSize, status, keyword },
      },
    });
    logResult('fetchAdminAfterServices', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || 'Fetch list failed');
  } catch (err) {
    logError('fetchAdminAfterServices', err);
    throw err;
  }
}

export async function fetchAdminAfterServiceDetail({ rightsNo, id }) {
  log('fetchAdminAfterServiceDetail', { rightsNo, id });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'detail',
        payload: { rightsNo, id },
      },
    });
    logResult('fetchAdminAfterServiceDetail', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || 'Fetch detail failed');
  } catch (err) {
    logError('fetchAdminAfterServiceDetail', err);
    throw err;
  }
}

export async function approveAfterService(payload) {
  log('approveAfterService', payload);
  return callAction('approve', payload, 'Approve failed');
}

export async function rejectAfterService(payload) {
  log('rejectAfterService', payload);
  return callAction('reject', payload, 'Reject failed');
}

export async function confirmAfterServiceReceive(payload) {
  log('confirmAfterServiceReceive', payload);
  return callAction('confirmReceive', payload, 'Confirm receive failed');
}

export async function markAfterServiceAbnormal(payload) {
  log('markAfterServiceAbnormal', payload);
  return callAction('markAbnormal', payload, 'Mark abnormal failed');
}

export async function refundAfterService(payload) {
  log('refundAfterService', payload);
  return callAction('refund', payload, 'Refund failed');
}

export async function closeAfterService(payload) {
  log('closeAfterService', payload);
  return callAction('close', payload, 'Close failed');
}

async function callAction(action, payload, defaultMsg) {
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action,
        payload,
      },
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
