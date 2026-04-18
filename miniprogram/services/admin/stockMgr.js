const CLOUD_FUNCTION = 'adminManageStock';

function log(action, data) {
  console.log(`[stockMgr] ${action}`, data);
}

function logResult(action, res) {
  console.log(`[stockMgr] ${action}:result`, res && res.result ? res.result : res);
}

function logError(action, err) {
  console.error(`[stockMgr] ${action}:error`, err);
}

export async function fetchStockList({
  page = 1,
  pageSize = 20,
  keyword = '',
  category1Id = '',
  category2Id = '',
}) {
  log('list', { page, pageSize, keyword, category1Id, category2Id });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'list',
        payload: { page, pageSize, keyword, category1Id, category2Id },
      },
    });
    logResult('list', res);
    if (res.result && res.result.success) {
      return res.result.data;
    }
    throw new Error((res.result && res.result.message) || '加载失败');
  } catch (err) {
    logError('list', err);
    throw err;
  }
}

export async function addSkuStock({ skuId, amount }) {
  log('addStock', { skuId, amount });
  try {
    const res = await wx.cloud.callFunction({
      name: CLOUD_FUNCTION,
      data: {
        action: 'addStock',
        payload: { skuId, amount },
      },
    });
    logResult('addStock', res);
    if (res.result && res.result.success) {
      return true;
    }
    throw new Error((res.result && res.result.message) || '更新失败');
  } catch (err) {
    logError('addStock', err);
    throw err;
  }
}
