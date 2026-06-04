const CLOUD_FUNCTION = 'adminManageHomeConfig';

function log(action, data) {
  console.log(`[homeConfigMgr] ${action}`, data);
}

async function callHomeConfig(action, payload = {}) {
  const res = await wx.cloud.callFunction({
    name: CLOUD_FUNCTION,
    data: { action, payload },
  });

  if (res.result && res.result.success) {
    return res.result.data || res.result;
  }

  throw new Error((res.result && res.result.message) || '操作失败');
}

export async function getHomeConfig() {
  log('getHomeConfig', {});
  try {
    const res = await callHomeConfig('get');
    return res.config || null;
  } catch (err) {
    console.error('[homeConfigMgr] getHomeConfig error', err);
    throw err;
  }
}

export async function saveHomeConfig(config) {
  log('saveHomeConfig', config);
  try {
    const res = await callHomeConfig('save', config);
    return res;
  } catch (err) {
    console.error('[homeConfigMgr] saveHomeConfig error', err);
    throw err;
  }
}
