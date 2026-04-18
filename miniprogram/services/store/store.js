/**
 * 获取门店列表
 */
export const fetchStoreList = async () => {
  const db = wx.cloud.database();
  try {
    const res = await db
      .collection('store')
      .where({
        status: 1,
      })
      .get();

    const list = res.data || [];
    // 数据适配：将新模型的 geoLoc.address 映射到 UI 需要的 address 字段
    return list.map((item) => ({
      ...item,
      address: item.geoLoc?.address || item.address || '',
      // 如果需要使用经纬度，也可以在这里映射
      // latitude: item.geoLoc?.geopoint?.coordinates?.[1],
      // longitude: item.geoLoc?.geopoint?.coordinates?.[0]
    }));
  } catch (e) {
    console.error('获取门店列表失败', e);
    return [];
  }
};
