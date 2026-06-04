/**
 * Admin Product Management Service
 */

const CLOUD_FUNCTION = 'adminManageGoods';

function log(action, data) {
  console.log(`[goodsMgr] ${action}`, data);
}

export async function fetchGoodsList({ page = 1, pageSize = 20, keyword = '', categoryId = '' }) {
  log('fetchGoodsList', { page, pageSize, keyword, categoryId });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'list',
        payload: { page, pageSize, keyword, categoryId },
      },
    });
    if (res.result.success) {
      log('fetchGoodsList success', res.result.data);
      return res.result.data;
    }
    throw new Error(res.result.message || 'Fetch list failed');
  } catch (e) {
    console.error('[goodsMgr] fetchGoodsList error', e);
    throw e;
  }
}

export async function fetchGoodsBriefMap(ids = []) {
  const uniqIds = Array.from(new Set((ids || []).filter(Boolean)));
  if (uniqIds.length === 0) {
    return {};
  }

  log('fetchGoodsBriefMap', { count: uniqIds.length });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'briefList',
        payload: { ids: uniqIds },
      },
    });
    if (res.result.success) {
      log('fetchGoodsBriefMap success', { count: Object.keys(res.result.data || {}).length });
      return res.result.data || {};
    }
    throw new Error(res.result.message || 'Fetch brief list failed');
  } catch (e) {
    console.error('[goodsMgr] fetchGoodsBriefMap error', e);
    throw e;
  }
}

export async function getGoodsDetail(id) {
  log('getGoodsDetail', { id });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'detail',
        payload: { id },
      },
    });
    if (res.result.success) {
      log('getGoodsDetail success', res.result.data);
      return res.result.data;
    }
    throw new Error(res.result.message || 'Fetch detail failed');
  } catch (e) {
    console.error('[goodsMgr] getGoodsDetail error', e);
    throw e;
  }
}

export async function createGoods(data) {
  log('createGoods input', data);
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'create',
        payload: data,
      },
    });
    if (res.result.success) {
      log('createGoods success', res.result.id);
      return res.result.id;
    }
    throw new Error(res.result.message || 'Create failed');
  } catch (e) {
    console.error('[goodsMgr] createGoods error', e);
    throw e;
  }
}

export async function updateGoods(id, data) {
  log('updateGoods input', { id, ...data });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'update',
        payload: { id, ...data },
      },
    });
    if (res.result.success) {
      log('updateGoods success', true);
      return true;
    }
    throw new Error(res.result.message || 'Update failed');
  } catch (e) {
    console.error('[goodsMgr] updateGoods error', e);
    throw e;
  }
}

export async function deleteGoods(id) {
  log('deleteGoods', { id });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'delete',
        payload: { id },
      },
    });
    if (res.result.success) {
      log('deleteGoods success', true);
      return true;
    }
    throw new Error(res.result.message || 'Delete failed');
  } catch (e) {
    console.error('[goodsMgr] deleteGoods error', e);
    throw e;
  }
}
