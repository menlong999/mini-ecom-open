const CLOUD_FUNCTION = 'adminManageCategory';

function log(action, data) {
  console.log(`[categoryMgr] ${action}`, data);
}

async function callCategory(action, payload = {}) {
  const res = await wx.cloud.callFunction({
    name: CLOUD_FUNCTION,
    data: { action, payload },
  });
  if (res.result && res.result.success) {
    return res.result.data || res.result;
  }
  throw new Error((res.result && res.result.message) || '操作失败');
}

export async function fetchCategory1List() {
  log('fetchCategory1List', {});
  try {
    const res = await callCategory('listCategory1');
    return res.list || [];
  } catch (err) {
    console.error('[categoryMgr] fetchCategory1List error', err);
    throw err;
  }
}

export async function fetchCategory2List(category1Id = '') {
  log('fetchCategory2List', { category1Id });
  try {
    const res = await callCategory('listCategory2', { category1Id });
    return res.list || [];
  } catch (err) {
    console.error('[categoryMgr] fetchCategory2List error', err);
    throw err;
  }
}

export async function createCategory1(data) {
  log('createCategory1', data);
  try {
    const res = await callCategory('createCategory1', data);
    return res.id;
  } catch (err) {
    console.error('[categoryMgr] createCategory1 error', err);
    throw err;
  }
}

export async function updateCategory1(data) {
  log('updateCategory1', data);
  try {
    await callCategory('updateCategory1', data);
    return true;
  } catch (err) {
    console.error('[categoryMgr] updateCategory1 error', err);
    throw err;
  }
}

export async function deleteCategory1(id) {
  log('deleteCategory1', { id });
  try {
    await callCategory('deleteCategory1', { id });
    return true;
  } catch (err) {
    console.error('[categoryMgr] deleteCategory1 error', err);
    throw err;
  }
}

export async function createCategory2(data) {
  log('createCategory2', data);
  try {
    const res = await callCategory('createCategory2', data);
    return res.id;
  } catch (err) {
    console.error('[categoryMgr] createCategory2 error', err);
    throw err;
  }
}

export async function updateCategory2(data) {
  log('updateCategory2', data);
  try {
    await callCategory('updateCategory2', data);
    return true;
  } catch (err) {
    console.error('[categoryMgr] updateCategory2 error', err);
    throw err;
  }
}

export async function deleteCategory2(id) {
  log('deleteCategory2', { id });
  try {
    await callCategory('deleteCategory2', { id });
    return true;
  } catch (err) {
    console.error('[categoryMgr] deleteCategory2 error', err);
    throw err;
  }
}
