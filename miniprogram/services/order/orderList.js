import { OrderStatus } from './orderConfig';

function buildCloudModelOrderWhere(openId, orderStatus) {
  const clauses = [{ _openid: { $eq: openId } }, { deleted: { $eq: false } }];

  if (orderStatus && orderStatus !== OrderStatus.ALL) {
    clauses.push({ status: { $eq: orderStatus } });
  }

  return { $and: clauses };
}

function buildDatabaseOrderWhere(openId, orderStatus) {
  const where = {
    _openid: openId,
    deleted: false,
  };

  if (orderStatus && orderStatus !== OrderStatus.ALL) {
    where.status = orderStatus;
  }

  return where;
}

/**
 * 获取订单列表数据 (已重构，不再使用 Mock)
 * @param {object} params - 包含分页和筛选参数 { parameter: { pageSize, pageNum, orderStatus } }
 */
export async function fetchOrders(params) {
  const app = getApp();
  const { pageSize, pageIndex, orderStatus } = params;
  const userInfo = wx.getStorageSync('userInfo');

  // 1. 必须检查用户是否登录
  if (!userInfo || !userInfo._openid) {
    console.warn('用户未登录，无法获取订单列表');
    // 返回一个符合预期的空数组结构，防止页面报错
    return Promise.resolve({ data: { orders: [] } });
  }

  // 2. 构建数据库查询条件
  const conds = {
    filter: {
      where: buildCloudModelOrderWhere(userInfo._openid, orderStatus),
    },
    pageSize,
    pageNumber: pageIndex,
    getCount: true,
    orderBy: [
      {
        createdAt: 'desc', // 按创建时间倒序
      },
    ],
  };

  // 3. 调用 app.cloudModels 进行查询
  try {
    const res = await app.cloudModels.order.list(conds);
    console.log('list order', res);
    const records = res?.data?.records || [];
    const total = res?.data?.total || 0;
    // 判断是否最后一页
    const isLastPage = pageIndex * pageSize >= total;
    if (!Array.isArray(records) || records.length === 0) {
      // 如果是最后一页，返回空数组，不抛错
      if (isLastPage) {
        return {
          nextList: [],
          isLastPage: true,
        };
      }
      throw new Error('No order records found');
    }
    return {
      nextList: records,
      isLastPage,
    };
  } catch (error) {
    console.error('fetch orders failed:', error);
    return Promise.resolve({ nextList: [], isLastPage: true });
  }
}

/**
 * 获取订单列表统计 (暂时简化)
 * 实际项目中，这里应该调用一个专门的云函数来高效地统计各个状态的数量
 */
export async function fetchOrdersCount() {
  const userInfo = wx.getStorageSync('userInfo');
  if (!userInfo || !userInfo._openid) {
    console.warn('用户未登录，无法获取订单统计');
    return Promise.resolve({ data: [] });
  }

  const db = wx.cloud.database();
  const openId = userInfo._openid;
  const statuses = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PENDING_DELIVERY,
    OrderStatus.PENDING_RECEIPT,
    OrderStatus.COMPLETE,
  ];

  const countPromises = statuses.map((status) =>
    db.collection('order').where(buildDatabaseOrderWhere(openId, status)).count()
  );

  try {
    const results = await Promise.all(countPromises);
    console.log('fetchOrdersCount results:', results);

    const data = statuses.map((status, index) => ({
      orderStatus: status,
      orderNum: results[index].total,
    }));
    console.log('fetchOrdersCount data:', data);

    return { data };
  } catch (error) {
    console.error('fetchOrdersCount failed:', error);
    return { data: [] };
  }
}
