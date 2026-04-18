import { OrderStatus } from '../order/orderConfig'; // 引入订单状态枚举

/**
 * 获取当前用户各种状态订单的数量
 * @returns {Promise<Array<{orderStatus: number, orderNum: number, tabName: string}>>}
 */
export async function fetchOrderTagInfos() {
  try {
    const userInfo = wx.getStorageSync('userInfo'); // 获取当前用户的 openId
    if (!userInfo || !userInfo._openid) {
      console.warn('用户未登录或未获取到 openId');
      return [];
    }
    const openId = userInfo._openid; // 获取用户的 openId
    console.log('fetchOrderTagInfos openId: ', openId);

    const db = wx.cloud.database();
    // 定义需要查询的各种状态
    const statuses = [
      { status: OrderStatus.PENDING_PAYMENT, iconName: 'wallet', title: '待付款' },
      { status: OrderStatus.PENDING_DELIVERY, iconName: 'deliver', title: '待发货' }, // 假设 PAID 状态即为待发货
      { status: OrderStatus.PENDING_RECEIPT, iconName: 'package', title: '待收货' },
      { status: OrderStatus.COMPLETE, iconName: 'comment', title: '待评价' }, // 简化处理，将已完成视为待评价
    ];
    // 创建并行的数据库查询任务
    const countPromises = statuses.map((item) => {
      const query = {
        _openid: openId,
        status: item.status,
        deleted: false,
      };
      // 对于“待评价”（已完成）状态，必须排除已经评价过的订单
      if (item.status === OrderStatus.COMPLETE) {
        query.isCommented = false; // 仅统计未评价的
      }
      return db.collection('order').where(query).count();
    });

    // 并发执行所有查询
    const results = await Promise.all(countPromises);

    console.log('fetch order tag counts:', results);

    // 将查询结果构造成页面需要的数据结构
    const orderTagInfos = results.map((res, index) => ({
      title: statuses[index].title,
      iconName: statuses[index].iconName,
      orderStatus: statuses[index].status,
      orderNum: res.total,
    }));

    // 添加“退款/售后”
    orderTagInfos.push({
      title: '退款/售后',
      iconName: 'exchang',
      orderStatus: 'AFTER_SERVICE',
      orderNum: 0,
    });

    // 你也可以在这里加入“退款/售后”的查询逻辑
    // const refundCount = await db.collection('refunds').where({ openId }).count();
    // orderTagInfos.push({ orderStatus: -1, orderNum: refundCount.total, tabName: '退款/售后' });

    console.log('fetch order tags:', orderTagInfos);

    return orderTagInfos;
  } catch (error) {
    console.error('获取订单状态数量失败:', error);
    // 出错时返回一个默认的空结构，防止页面报错
    // 出错时返回一个默认的空结构，防止页面报错
    return [
      {
        orderStatus: OrderStatus.PENDING_PAYMENT,
        orderNum: 0,
        iconName: 'wallet',
        title: '待付款',
      },
      {
        orderStatus: OrderStatus.PENDING_DELIVERY,
        orderNum: 0,
        iconName: 'deliver',
        title: '待发货',
      }, // 假设 PAID 状态即为待发货
      {
        orderStatus: OrderStatus.PENDING_RECEIPT,
        orderNum: 0,
        iconName: 'package',
        title: '待收货',
      },
      { orderStatus: OrderStatus.COMPLETE, orderNum: 0, iconName: 'comment', title: '待评价' }, // 简化处理，将已完成视为待评价
      { orderStatus: 'AFTER_SERVICE', orderNum: 0, iconName: 'exchang', title: '退款/售后' },
    ];
  }
}

export async function fetchUserInfo() {
  const userInfo = wx.getStorageSync('userInfo'); // 获取当前用户的 openId
  if (!userInfo || !userInfo._openid) {
    console.warn('用户未登录或未获取到 openId');
    return {};
  }
  const openId = userInfo._openid; // 获取用户的 openId
  console.log('fetchUserInfo openId: ', openId);
  const app = getApp();
  const { data } = await app.cloudModels.user_info.get({
    filter: {
      where: {
        $and: [
          {
            _openid: {
              $eq: openId,
            },
          },
        ],
      },
    },
  });
  console.log('fetchUserInfo data: ', data);
  return data.record || {};
}

export async function updateUserInfo() {
  const userInfo = wx.getStorageSync('userInfo');
  if (!userInfo || !userInfo._openid) {
    console.warn('用户未登录或未获取到 openId');
    return;
  }

  // 复制并剔除不可更新字段
  const updateData = { ...userInfo };
  delete updateData._id;
  delete updateData._openid;
  console.log('updateUserInfo via cloud:', updateData);

  try {
    await wx.cloud.callFunction({
      name: 'manageUser',
      data: {
        action: 'updateInfo',
        payload: updateData,
      },
    });
  } catch (err) {
    console.error('Update user info cloud failed:', err);
    throw err;
  }
}
