/** 获取首页数据 */
export async function fetchHome() {
  const app = getApp();

  try {
    const res = await app.cloudModels.home_config.list({
      filter: {
        where: {},
        orderBy: [{ updatedAt: 'desc' }],
      },
      pageSize: 1,
      pageNumber: 1,
      getCount: true,
    });

    const records = (res && res.data && res.data.records) || [];
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No home_config records found');
    }

    const first = records[0];
    return {
      // swiper: [{ image, spuId }]
      swiper: (first.swiper || []).map((item) => ({
        image: (item && (item.image || item.imageUrl)) || '',
        spuId: (item && (item.spuId || item.skuId)) || '',
        linkType: (item && item.linkType) || 'spu',
        poi: (item && item.poi) || null,
      })),
      // tabList: [{ text, spuIds }]
      tabList: (first.tabList || []).map((item) => ({
        text: (item && item.text) || '',
        spuIds: Array.isArray(item && item.spuIds) ? item.spuIds : [],
      })),
      searchPlaceholder: (first && first.searchPlaceholder) || '',
    };
  } catch (error) {
    console.error('[HomeService] Fetch error:', error);
    return {
      swiper: [],
      tabList: [],
      searchPlaceholder: '',
    };
  }
}
