import { runtimeConfig } from '../../config/index';

const defaultDesc = runtimeConfig.assets?.defaultGoodsDescImages || [];

function normalizeDesc(desc) {
  if (Array.isArray(desc)) return desc.filter(Boolean);
  if (desc) return [desc];
  return defaultDesc;
}

/** 获取商品详情（聚合 spu/spec/sku） */
export async function fetchGood(spuId) {
  console.log('Fetching good with spuId:', spuId);
  const app = getApp();

  // 1. 查询 SPU
  const spuRes = await app.cloudModels.goods_spu.list({
    filter: { where: { _id: { $eq: spuId } } },
    pageSize: 1,
  });
  const spu = spuRes?.data?.records?.[0];
  console.log('Fetched SPU:', spu);

  if (!spu) {
    throw new Error('商品不存在: ' + spuId);
  }

  // 2. 查询关联的 Spec 列表
  const specRes = await app.cloudModels.goods_spec.list({
    filter: { where: { spuId: { $eq: spu._id } } },
    pageSize: 50,
    orderBy: [{ sortOrder: 'asc' }],
  });
  const specs = specRes?.data?.records || [];
  console.log('Fetched Specs:', specs.length);

  // 3. 查询关联的 SKU 列表
  const skuRes = await app.cloudModels.goods_sku.list({
    filter: { where: { spuId: { $eq: spu._id } } },
    pageSize: 500,
  });
  const skus = skuRes?.data?.records || [];
  console.log('Fetched SKUs:', skus.length);

  // 4. 组装为 goods 格式
  return assembleGoods(spu, specs, skus);
}

/** 组装为前端期望的 goods 格式 */
function assembleGoods(spu, specs, skus) {
  // 计算最大售价
  const maxSalePrice =
    skus.length > 0 ? Math.max(...skus.map((s) => s.price || 0)) : spu.minSalePrice || 0;

  const good = {
    // SPU 基础信息，所有页面使用的 spuId 都是 goods_spu 的 _id
    spuId: spu._id,
    title: spu.title,
    primaryImage: spu.primaryImage,
    images: spu.images || [spu.primaryImage],
    desc: normalizeDesc(spu.desc),
    minSalePrice: spu.minSalePrice || 0,
    maxSalePrice: maxSalePrice,
    maxLinePrice: spu.maxLinePrice || 0,
    soldNum: spu.soldNum || 0,
    spuStockQuantity: spu.spuStockQuantity || 0,
    isPutOnSale: spu.isPutOnSale ? 1 : 0,
    available: 1,

    // 标签列表
    spuTagList: (spu.tags || []).map((tag) => ({ title: tag })),

    // 规格列表 (转换为 specList 格式)
    specList: specs.map((spec) => ({
      specId: spec.specId,
      title: spec.title,
      specValueList: (spec.values || []).map((v) => ({
        specValueId: v.valueId,
        specValue: v.value,
      })),
    })),

    // SKU 列表 (转换为 skuList 格式)
    skuList: skus.map((sku) => ({
      skuId: sku.skuId,
      skuImage: sku.image || spu.primaryImage,
      price: sku.price || 0,
      specInfo: (sku.specValues || []).map((sv) => {
        // Find corresponding spec title and value from the specs list
        const spec = specs.find((s) => s.specId === sv.specId);
        let specTitle = '';
        let specValue = '';
        if (spec) {
          specTitle = spec.title || '';
          const valItem = (spec.values || []).find((v) => v.valueId === sv.specValueId);
          specValue = valItem ? valItem.value : '';
        }
        return {
          specId: sv.specId,
          specValueId: sv.specValueId,
          specTitle,
          specValue,
        };
      }),
      stockInfo: {
        stockQuantity: sku.stock || 0,
      },
    })),

    // 限购信息（暂时为空）
    limitInfo: [],
  };

  console.log('Assembled good:', good);

  return good;
}
