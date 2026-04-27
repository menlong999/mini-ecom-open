const app = getApp();

// 获取购物车列表
export async function fetchCartList(openId) {
  console.log('fetchCartList: ', openId);
  const res = await app.cloudModels.cart.list({
    filter: {
      where: {
        $and: [{ _openid: { $eq: openId } }],
      },
    },
    getCount: true,
  });
  console.log('fetchCartList: ', res);
  return res?.data?.records || [];
}

// 添加商品到购物车
export async function addCart(_openId, goods) {
  const res = await wx.cloud.callFunction({
    name: 'manageCart',
    data: {
      action: 'add',
      payload: { goods },
    },
  });

  if (!res.result || !res.result.success) {
    throw new Error(res.result?.message || '加入购物车失败');
  }
}

// 选择/取消选择商品
export async function selectGoods(openId, spuId, skuId, isSelected) {
  console.log('selectGoods', spuId, skuId, isSelected);
  await wx.cloud.callFunction({
    name: 'manageCart',
    data: {
      action: 'updateSelection',
      payload: { spuId, skuId, isSelected },
    },
  });
}

// 全选/取消全选
export async function selectAllGoods(openId, isSelected) {
  console.log('selectAllGoods', isSelected);
  await wx.cloud.callFunction({
    name: 'manageCart',
    data: {
      action: 'selectAll',
      payload: { isSelected },
    },
  });
}

// 修改数量
export async function changeQuantity(openId, spuId, skuId, quantity) {
  console.log('changeQuantity', spuId, skuId, quantity);
  await wx.cloud.callFunction({
    name: 'manageCart',
    data: {
      action: 'updateQuantity',
      payload: { spuId, skuId, quantity },
    },
  });
}

// 删除商品
export async function deleteGoods(openId, spuId, skuId) {
  console.log('deleteGoods', spuId, skuId);
  await wx.cloud.callFunction({
    name: 'manageCart',
    data: {
      action: 'delete',
      payload: { spuId, skuId },
    },
  });
}

// 清空失效商品
export async function clearInvalidGoods(_openId) {
  console.log('clearInvalidGoods');
  await wx.cloud.callFunction({
    name: 'manageCart',
    data: {
      action: 'clearInvalid',
    },
  });
}
