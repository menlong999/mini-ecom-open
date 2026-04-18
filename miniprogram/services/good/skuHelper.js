/**
 * 获取 SPU 的默认 SKU
 * 优先返回 isDefault=true 的 SKU，否则返回第一个有库存的 SKU
 * 同时查询规格信息，补充 specTitle 和 specValue 文本
 *
 * @param {Object} app 小程序 App 实例 (用于访问 cloudModels)
 * @param {string} spuId SPU ID
 * @returns {Promise<Object|null>} 包含丰富规格信息的 SKU 对象 或 null
 */
export async function getDefaultSku(app, spuId) {
  try {
    // 1. 先查找 isDefault=true 的 SKU
    let sku = null;
    const defaultRes = await app.cloudModels.goods_sku.list({
      filter: {
        where: {
          $and: [{ spuId: { $eq: spuId } }, { isDefault: { $eq: true } }],
        },
      },
      pageSize: 1,
    });

    if (defaultRes?.data?.records?.length > 0) {
      sku = defaultRes.data.records[0];
    } else {
      // 2. 没有默认 SKU，返回第一个有库存的 SKU
      const firstRes = await app.cloudModels.goods_sku.list({
        filter: {
          where: {
            $and: [{ spuId: { $eq: spuId } }, { stock: { $gt: 0 } }],
          },
        },
        pageSize: 1,
        orderBy: [{ price: 'asc' }],
      });
      sku = firstRes?.data?.records?.[0] || null;
    }

    if (!sku) return null;

    // 3. 查询该 SPU 的所有规格定义 (获取规格名称和值)
    // 这一步是为了让 API/List 页面也能拿到 specTitle 和 specValue
    const specsRes = await app.cloudModels.goods_spec.list({
      filter: { where: { spuId: { $eq: spuId } } },
    });
    const specs = specsRes?.data?.records || [];

    // 4. 丰富 specValues，添加 specTitle 和 specValue 文本
    const enrichedSpecValues = (sku.specValues || []).map((sv) => {
      // 查找对应的规格定义
      const spec = specs.find((s) => s._id === sv.specId || s.specId === sv.specId);
      let specTitle = '';
      let specValue = '';

      if (spec) {
        specTitle = spec.title || '';
        // 在 values 数组中查找对应的规格值
        const valueItem = (spec.values || []).find(
          (v) => v.valueId === sv.valueId || v.valueId === sv.specValueId
        );
        specValue = valueItem?.value || '';
      }

      return {
        // 确保字段齐全
        specId: sv.specId || '',
        specValueId: sv.valueId || sv.specValueId || '',
        specTitle,
        specValue,
      };
    });

    return {
      ...sku,
      specValues: enrichedSpecValues,
    };
  } catch (err) {
    console.error(`[skuHelper] getDefaultSku error for spuId ${spuId}:`, err);
    return null;
  }
}
