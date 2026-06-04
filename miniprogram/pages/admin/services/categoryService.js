/**
 * 分类服务
 * 获取一级和二级分类数据
 */

/**
 * 获取所有分类（一级和二级）
 * @returns {Promise<{category1List: Array, category2List: Array}>}
 */
export async function fetchAllCategories() {
  const app = getApp();

  try {
    // 并行获取一级和二级分类
    const [res1, res2] = await Promise.all([
      app.cloudModels.category1.list({
        filter: { where: {} },
        pageSize: 100,
      }),
      app.cloudModels.category2.list({
        filter: { where: {} },
        pageSize: 500,
      }),
    ]);

    const rawCategory1List = (res1 && res1.data && res1.data.records) || [];
    const rawCategory2List = (res2 && res2.data && res2.data.records) || [];

    // 映射为 TDesign Picker 需要的格式 (label 字段用于显示)
    const category1List = rawCategory1List.map((c) => ({
      ...c,
      label: c.category1Name,
      value: c._id,
    }));

    const category2List = rawCategory2List.map((c) => ({
      ...c,
      label: c.category2Name,
      value: c._id,
    }));

    console.log(
      '[fetchAllCategories] category1:',
      category1List.length,
      'category2:',
      category2List.length
    );

    return { category1List, category2List };
  } catch (err) {
    console.error('[fetchAllCategories] Error:', err);
    throw err;
  }
}

export function getCategory1IdValue(category1Id) {
  if (!category1Id) return '';
  if (typeof category1Id === 'string') return category1Id;
  if (typeof category1Id === 'object') return category1Id._id || '';
  return '';
}

/**
 * 根据一级分类ID获取二级分类列表
 * @param {Array} category2List 完整的二级分类列表
 * @param {String} category1Id 一级分类ID
 * @returns {Array} 过滤后的二级分类列表
 */
export function filterCategory2ByCategory1(category2List, category1Id) {
  if (!category1Id) return [];
  return category2List.filter((c2) => getCategory1IdValue(c2.category1Id) === category1Id);
}
