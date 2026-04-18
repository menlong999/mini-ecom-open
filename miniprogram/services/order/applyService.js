/**
 * 获取售后单预览数据
 * 这里为了简单，先直接复用 order service 的逻辑获取订单详情，然后在前端或这里处理成 preview 数据。
 * 或者，如果逻辑复杂，建议创建一个 cloud function `getRightsPreview`。
 * 目前方案：直接复用 app.cloudModels.order.get 获取订单详情，纯前端/Service层计算。
 */
export async function fetchRightsPreview(params) {
  const { orderId } = params;
  const userInfo = wx.getStorageSync('userInfo') || {};
  const openId = userInfo._openid;

  try {
    if (!orderId) throw new Error('Missing orderId');
    if (!openId) throw new Error('用户未登录');

    const db = wx.cloud.database();
    const res = await db
      .collection('order')
      .where({
        _id: orderId,
        _openid: openId,
      })
      .limit(1)
      .get();

    const order = res && res.data && res.data.length ? res.data[0] : null;
    if (!order) throw new Error('Order not found');

    const goodsList = (order.goodsList || []).map((goods) => {
      let specs = goods.specs;
      if (Array.isArray(specs)) {
        specs = specs.join(' / ');
      }
      if (!specs && Array.isArray(goods.specInfo)) {
        specs = goods.specInfo
          .map((s) => s.specValue || '')
          .filter(Boolean)
          .join(' / ');
      }

      return {
        skuId: goods.skuId,
        spuId: goods.spuId,
        thumb: goods.thumb,
        title: goods.title,
        specs: specs || '',
        specInfo: goods.specInfo || [],
        price: goods.price,
        quantity: goods.quantity,
      };
    });

    const refundableAmount = goodsList.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return sum + price * quantity;
    }, 0);

    return {
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        goodsList,
        refundableAmount,
        shippingFeeIncluded: 0, // TODO 实际运费逻辑如何处理
      },
    };
  } catch (error) {
    console.error('fetchRightsPreview failed', error);
    throw error;
  }
}

/** 获取可选的售后原因列表 */
export function fetchApplyReasonList(_params) {
  // 简单起见，返回静态配置。也可改为从云数据库 `config` 集合拉取
  return Promise.resolve({
    data: {
      rightsReasonList: [
        { id: 1, desc: '实际商品与描述不符' },
        { id: 2, desc: '质量问题' },
        { id: 3, desc: '少件/漏发' },
        { id: 4, desc: '包装/商品/污迹/裂痕/变形' },
        { id: 5, desc: '发货太慢' },
        { id: 6, desc: '商家发错货' },
        { id: 8, desc: '不喜欢/不想要' },
      ],
    },
  });
}

/** 发起售后申请 */
export function dispatchApplyService(params) {
  return wx.cloud
    .callFunction({
      name: 'manageAfterService',
      data: {
        action: 'apply',
        payload: params,
      },
    })
    .then((res) => {
      if (res.result && res.result.success) {
        return res.result;
      }
      throw new Error((res.result && res.result.message) || 'Apply failed');
    });
}

import { uploadImages } from '../../utils/uploadHelper';

export { uploadImages };
