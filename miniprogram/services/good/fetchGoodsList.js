import { getDefaultSku } from './skuHelper';

/** 排序字段 */
const SORT_FIELD = {
  OVERALL: 0,
  PRICE: 1,
};

/** 排序方向 (API参数值) */
const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
};

/** 获取商品列表（供分类页/搜索页使用） */
export async function fetchGoodsList(params = {}) {
  const {
    categoryId = '',
    keyword = '',
    sortField = SORT_FIELD.OVERALL,
    sortDirection = SORT_DIRECTION.DESC,
    minPrice = 0,
    maxPrice,
    pageNum = 1,
    pageSize = 30,
  } = params;

  console.log('fetchGoodsList params:', params);

  const app = getApp();

  // 1. 构建查询条件
  const whereConditions = [
    { isPutOnSale: { $eq: true } }, // 上架判断
    { spuStockQuantity: { $gt: 0 } }, // 库存判断
  ];

  // 分类过滤
  if (categoryId) {
    whereConditions.push({ categoryId: { $eq: categoryId } });
  }

  // 价格范围过滤（在 SPU 层面初筛）
  if (minPrice > 0) {
    whereConditions.push({ minSalePrice: { $gte: minPrice / 100 } });
  }
  if (maxPrice && maxPrice > 0) {
    whereConditions.push({ minSalePrice: { $lte: maxPrice / 100 } });
  }

  // 关键词搜索（标题模糊匹配）
  if (keyword) {
    whereConditions.push({ title: { $regex: keyword } });
  }

  // 2. 构建排序
  let orderBy = [{ updatedAt: 'desc' }]; // 默认按更新时间倒序（综合）

  if (sortField === SORT_FIELD.PRICE) {
    // 价格排序
    // sortDirection: 'asc' / 'desc'
    orderBy = [{ minSalePrice: sortDirection }];
  }

  console.log(
    'sortField:',
    sortField,
    'sortDirection:',
    sortDirection,
    'orderBy:',
    orderBy,
    'whereConditions:',
    whereConditions
  );

  // 3. 查询 goods_spu 列表
  const res = await app.cloudModels.goods_spu.list({
    filter: { where: { $and: whereConditions } },
    pageSize,
    pageNumber: pageNum,
    getCount: true,
    orderBy,
  });

  const spuList = res?.data?.records || [];
  const totalCount = res?.data?.total || 0;

  console.log('Fetched goods_spu list:', spuList.length, 'total:', totalCount);

  // 4. 为每个 SPU 查询默认 SKU 并转换格式
  const goodsList = await Promise.all(
    spuList.map(async (spu) => {
      // 使用提取出来的公共方法，包含丰富的 Spec 信息
      const defaultSku = await getDefaultSku(app, spu._id);

      return {
        // 所有在页面中使用的 spuId 都是来自 goods_spu 的 _id 而非 goods_spu 的 spuId
        spuId: spu._id,
        thumb: defaultSku?.image || spu.primaryImage,
        title: spu.title,
        price: defaultSku?.price || spu.minSalePrice,
        originPrice: spu.maxLinePrice,
        tags: spu.tags || [],
        desc: '',

        // 默认 SKU 信息（用于快速加购）
        defaultSku: defaultSku
          ? {
              skuId: defaultSku.skuId,
              price: defaultSku.price,
              stock: defaultSku.stock,
              specValues: defaultSku.specValues || [],
            }
          : null,

        // 库存状态
        hasStock: (defaultSku?.stock || spu.spuStockQuantity || 0) > 0,
      };
    })
  );

  return {
    spuList: goodsList,
    totalCount,
  };
}
