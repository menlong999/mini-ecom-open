import { getDefaultSku } from './skuHelper';

/** 获取商品列表（供首页使用） */
export async function fetchGoodsList(categoryId, pageIndex = 1, pageSize = 20) {
  console.log(
    'Fetching goods list for category:',
    categoryId,
    'Page:',
    pageIndex,
    'Size:',
    pageSize
  );

  const app = getApp();

  // 1. 查询 goods_spu 列表（只查询上架且有库存的商品）
  const res = await app.cloudModels.goods_spu.list({
    filter: {
      where: {
        $and: [
          { categoryId: { $eq: categoryId } },
          { isPutOnSale: { $eq: true } }, // 上架判断
          { spuStockQuantity: { $gt: 0 } }, // 库存判断
        ],
      },
    },
    pageSize,
    pageNumber: pageIndex,
    getCount: true,
  });

  const spuList = res?.data?.records || [];
  const total = res?.data?.total || 0;
  const isLastPage = pageIndex * pageSize >= total;

  console.log(
    'Fetched goods_spu list:',
    spuList.length,
    'total:',
    total,
    'isLastPage:',
    isLastPage
  );

  // 2. 为每个 SPU 查询默认 SKU
  const nextList = await Promise.all(
    spuList.map(async (spu) => {
      // 使用提取出来的公共方法，包含丰富的 Spec 信息
      const defaultSku = await getDefaultSku(app, spu._id);
      console.log('SPU:', spu.spuId, 'defaultSku:', defaultSku);

      return {
        // SPU 基础信息
        // spuId: spu.spuId,
        // 使用了数据模型自增字段，spuId 虽然也是自增但是没有使用，原因是因为所有关联字段都默认用了系统生成的_id
        spuId: spu._id,
        title: spu.title,
        primaryImage: defaultSku?.image || spu.primaryImage,
        minSalePrice: defaultSku?.price || spu.minSalePrice,
        minLinePrice: spu.maxLinePrice,
        spuTagList: (spu.tags || []).map((tag) => ({ title: tag })),

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

  return { nextList, isLastPage };
}

/**
 * 获取商品列表（供首页自定义 Tab 使用）
 * - 按 spuIds 顺序展示
 * - 分页基于 spuIds 的切片（避免后端排序不可控）
 */
export async function fetchGoodsListBySpuIds(spuIds = [], pageIndex = 1, pageSize = 20) {
  const ids = Array.isArray(spuIds) ? spuIds.filter(Boolean) : [];
  const total = ids.length;

  if (total === 0) {
    return { nextList: [], isLastPage: true };
  }

  const start = (pageIndex - 1) * pageSize;
  const end = start + pageSize;
  const pageIds = ids.slice(start, end);
  const isLastPage = end >= total;

  const app = getApp();

  // 只查当前页的 SPU，后续按 pageIds 做顺序重排
  const res = await app.cloudModels.goods_spu.list({
    filter: {
      where: {
        $and: [
          { _id: { $in: pageIds } },
          { isPutOnSale: { $eq: true } },
          { spuStockQuantity: { $gt: 0 } },
        ],
      },
    },
    pageSize: Math.min(pageIds.length, 100),
    pageNumber: 1,
  });

  const spuList = (res && res.data && res.data.records) || [];
  const spuMap = {};
  spuList.forEach((spu) => {
    spuMap[spu._id] = spu;
  });

  const ordered = pageIds.map((id) => spuMap[id]).filter(Boolean);

  const nextList = await Promise.all(
    ordered.map(async (spu) => {
      const defaultSku = await getDefaultSku(app, spu._id);

      return {
        spuId: spu._id,
        title: spu.title,
        primaryImage: (defaultSku && defaultSku.image) || spu.primaryImage,
        minSalePrice: (defaultSku && defaultSku.price) || spu.minSalePrice,
        minLinePrice: spu.maxLinePrice,
        spuTagList: (spu.tags || []).map((tag) => ({ title: tag })),
        defaultSku: defaultSku
          ? {
              skuId: defaultSku.skuId,
              price: defaultSku.price,
              stock: defaultSku.stock,
              specValues: defaultSku.specValues || [],
            }
          : null,
        hasStock: ((defaultSku && defaultSku.stock) || spu.spuStockQuantity || 0) > 0,
      };
    })
  );

  return { nextList, isLastPage };
}
