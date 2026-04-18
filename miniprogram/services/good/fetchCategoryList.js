/**
 * 获取所有记录 (循环分页)
 * @param {string} modelName
 */
async function fetchAllFromModel(modelName) {
  const app = getApp();
  const MAX_LIMIT = 200; // 数据模型单次最大通常较大，或者先设置一个较大值
  let allRecords = [];
  let pageNumber = 1;
  let hasMore = true;

  while (hasMore) {
    const { data } = await app.cloudModels[modelName].list({
      pageNumber,
      pageSize: MAX_LIMIT,
      filter: {
        where: {},
      },
    });

    const records = data.records || [];
    allRecords = allRecords.concat(records);

    hasMore = records.length === MAX_LIMIT;
    pageNumber++;
  }

  console.log(`[fetchAllFromModel] ${modelName} fetched records:`, allRecords);
  return allRecords;
}

/** 获取商品列表 */
async function fetchFromCloud() {
  try {
    // 1. 并行获取一级和二级分类数据 (利用 SDK 数据模型)
    // 客户端联表查询策略：对于分类这种读多写少且数据量小（通常几百条内）的业务，
    // 全量拉取两个表在本地内存组装是网络开销最小（仅2次请求）且最灵活的方案。
    const [c1List, c2List] = await Promise.all([
      fetchAllFromModel('category1'),
      fetchAllFromModel('category2'),
    ]);

    // 2. 组装数据为 3 层结构
    // Level 0: 一级分类 (SideBar)
    // Level 1: 分组头 (同名一级分类)
    // Level 2: 二级分类 (Grid Item)
    const result = c1List.map((c1) => {
      // 筛选关联的子分类
      // category2 通过 category1Id 关联 category1
      const subItems = c2List
        .filter((c2) => {
          if (!c2.category1Id) return false;
          // 兼容关联字段可能是对象(ref)或字符串(id)
          const refId = typeof c2.category1Id === 'object' ? c2.category1Id._id : c2.category1Id;
          return refId === c1._id;
        })
        .map((c2) => {
          // 调试：检查 thumbnail 字段的实际类型和值
          console.log('[DEBUG] c2.thumbnail type:', typeof c2.thumbnail, 'value:', c2.thumbnail);

          // 确保 thumbnail 是字符串（不再 fallback 到 c1.thumbnail）
          let thumbnailUrl = c2.thumbnail || '';
          if (typeof thumbnailUrl === 'object' && thumbnailUrl !== null) {
            // 如果是对象，尝试提取 url 或 fileID 等常见属性
            thumbnailUrl =
              thumbnailUrl.url || thumbnailUrl.fileID || thumbnailUrl.tempFileURL || '';
            console.log('[DEBUG] thumbnail is object, extracted:', thumbnailUrl);
          }

          return {
            groupId: c2._id,
            name: c2.category2Name,
            thumbnail: thumbnailUrl,
          };
        });

      return {
        groupId: c1._id,
        name: c1.category1Name,
        thumbnail: c1.thumbnail,
        children: [
          {
            groupId: c1._id + '_sub',
            name: c1.category1Name, // 分组标题
            children: subItems,
          },
        ],
      };
    });

    console.log(`[fetchFromCloud] category list:`, result);
    return result;
  } catch (err) {
    console.error('Fetch category models failed', err);
    return [];
  }
}

/** 获取商品列表 */
export function getCategoryList() {
  return fetchFromCloud();
}
