const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

const COLL_SPU = "goods_spu";
const COLL_SKU = "goods_sku";
const COLL_SPEC = "goods_spec";
const USER_COLLECTION = "user_info";

exports.main = async (event, context) => {
  const { action, payload } = event;
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  const adminInfo = await getAdminInfo(openId);
  if (!adminInfo) {
    return { success: false, message: "Permission denied" };
  }

  try {
    switch (action) {
      case "list":
        return await listGoods(payload);
      case "briefList":
        return await listGoodsBrief(payload);
      case "detail":
        return await getGoodsDetail(payload);
      case "create":
        return await createGoods(payload);
      case "update":
        return await updateGoods(payload);
      case "delete":
        return await deleteGoods(payload);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageGoods] error:", err);
    return { success: false, message: err.message };
  }
};

async function getAdminInfo(openId) {
  const res = await db
    .collection(USER_COLLECTION)
    .where({ _openid: openId })
    .limit(1)
    .get();
  if (!res.data || res.data.length === 0) return null;
  const user = res.data[0];
  if (user.role !== "admin") return null;
  return {
    openId,
    nickName: user.nickName || "管理员",
  };
}

async function listGoods({
  page = 1,
  pageSize = 20,
  keyword = "",
  categoryId = "",
}) {
  console.log("[listGoods] params:", { page, pageSize, keyword, categoryId });
  const skip = (page - 1) * pageSize;
  let query = {};

  // Keyword filter
  if (keyword && keyword.trim() !== "") {
    query.title = db.RegExp({
      regexp: keyword,
      options: "i",
    });
  }

  // Category filter (二级分类ID)
  if (categoryId && categoryId.trim() !== "") {
    query.categoryId = categoryId;
  }

  const countResult = await db.collection(COLL_SPU).where(query).count();
  const { total } = countResult;

  const listResult = await db
    .collection(COLL_SPU)
    .where(query)
    .skip(skip)
    .limit(pageSize)
    .orderBy("updatedAt", "desc")
    .get();

  // Map backend fields to frontend expected fields for list view
  const list = listResult.data.map((item) => ({
    _id: item._id,
    title: item.title,
    primaryImage: item.primaryImage,
    minSalePrice: item.minSalePrice, // Use minSalePrice
    spuStockQuantity: item.spuStockQuantity, // Use spuStockQuantity
    isPutOnSale: item.isPutOnSale,
  }));

  return {
    success: true,
    data: {
      list,
      total,
      page,
      pageSize,
    },
  };
}

async function listGoodsBrief({ ids = [] }) {
  const uniqIds = Array.from(new Set((ids || []).filter(Boolean)));
  if (!uniqIds.length) {
    return { success: true, data: {} };
  }

  const res = await db
    .collection(COLL_SPU)
    .where({
      _id: _.in(uniqIds),
    })
    .get();

  const map = {};
  (res.data || []).forEach((spu) => {
    map[spu._id] = {
      title: spu.title,
      primaryImage: spu.primaryImage,
      minSalePrice: spu.minSalePrice,
    };
  });

  return { success: true, data: map };
}

async function getGoodsDetail({ id }) {
  console.log("[getGoodsDetail] id:", id);
  if (!id) throw new Error("ID required");

  // 1. Get SPU
  const spuRes = await db.collection(COLL_SPU).doc(id).get();
  const spu = spuRes.data;

  // 2. Get Specs
  const specRes = await db
    .collection(COLL_SPEC)
    .where({ spuId: id })
    .orderBy("sortOrder", "asc")
    .get();
  const specs = specRes.data;

  // 3. Get SKUs
  const skuRes = await db.collection(COLL_SKU).where({ spuId: id }).get();
  const skus = skuRes.data;

  // Assemble for Frontend Edit Form
  // Frontend expects: { title, price, ... specList, skuList }
  const data = {
    _id: spu._id,
    title: spu.title,
    categoryId: spu.categoryId,
    primaryImage: spu.primaryImage,
    images: spu.images || [],
    desc: spu.desc, // Pass through array or string as is
    minSalePrice: spu.minSalePrice,
    maxLinePrice: spu.maxLinePrice,
    spuStockQuantity: spu.spuStockQuantity,
    isPutOnSale: spu.isPutOnSale,
    tags: spu.tags || [],

    // Transform Specs to simplified frontend format
    specList: specs.map((s) => ({
      specId: s.specId,
      title: s.title,
      values: s.values, // [{ valueId, value }]
    })),

    // Transform SKUs
    skuList: skus.map((s) => ({
      skuId: s.skuId,
      price: s.price,
      stock: s.stock,
      image: s.image,
      specValues: s.specValues, // [{ specId, specValueId }]
    })),
  };

  return { success: true, data };
}

async function createGoods(data) {
  console.log("[createGoods] data:", data);
  const {
    title,
    categoryId,
    primaryImage,
    images,
    minSalePrice,
    maxLinePrice,
    spuStockQuantity,
    specList,
    skuList,
    desc,
    isPutOnSale,
    tags,
  } = data;

  if (!title || !minSalePrice) {
    throw new Error("Title and Price are required");
  }

  const transaction = await db.startTransaction();

  try {
    // 1. Create SPU
    const spuRes = await transaction.collection(COLL_SPU).add({
      data: {
        title,
        categoryId,
        primaryImage,
        images: images || [],
        desc: desc || [],
        minSalePrice: Number(minSalePrice),
        maxLinePrice: Number(maxLinePrice || 0),
        spuStockQuantity: Number(spuStockQuantity || 0),
        isPutOnSale: isPutOnSale !== false, // Default true
        tags: Array.isArray(tags) ? tags : [],
        soldNum: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });

    const spuId = spuRes._id;

    // 2. Create Specs
    if (specList && specList.length > 0) {
      for (let i = 0; i < specList.length; i++) {
        const spec = specList[i];
        await transaction.collection(COLL_SPEC).add({
          data: {
            spuId,
            specId: spec.specId || `spec_${Date.now()}_${i}`,
            title: spec.title,
            values: spec.values || [],
            sortOrder: i,
          },
        });
      }
    }

    // 3. Create SKUs
    if (skuList && skuList.length > 0) {
      for (const sku of skuList) {
        await transaction.collection(COLL_SKU).add({
          data: {
            spuId,
            skuId: sku.skuId || `sku_${Date.now()}_${Math.random()}`,
            price: Number(sku.price),
            stock: Number(sku.stock),
            image: sku.image || primaryImage,
            specValues: sku.specValues || [],
          },
        });
      }
    }

    await transaction.commit();
    return { success: true, id: spuId };
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

async function updateGoods({ id, ...data }) {
  if (!id) throw new Error("ID required for update");
  console.log("[updateGoods] id:", id, "data:", data);

  const {
    title,
    categoryId,
    primaryImage,
    images,
    minSalePrice,
    maxLinePrice,
    spuStockQuantity,
    specList,
    skuList,
    desc,
    isPutOnSale,
    tags,
  } = data;

  const transaction = await db.startTransaction();

  try {
    // 1. Update SPU
    await transaction
      .collection(COLL_SPU)
      .doc(id)
      .update({
        data: {
          title,
          categoryId,
          primaryImage,
          images: images || [],
          desc: desc || [],
          minSalePrice: Number(minSalePrice),
          maxLinePrice: Number(maxLinePrice || 0),
          spuStockQuantity: Number(spuStockQuantity || 0),
          isPutOnSale: isPutOnSale,
          tags: Array.isArray(tags) ? tags : [],
          updatedAt: Date.now(),
        },
      });

    // 2. Replace Specs (Simplest strategy: Delete All + Create New)
    // In transactions, bulk where().remove() is not supported. Query then loop-delete.
    const oldSpecRes = await transaction.collection(COLL_SPEC).where({ spuId: id }).get();
    for (const spec of oldSpecRes.data) {
      await transaction.collection(COLL_SPEC).doc(spec._id).remove();
    }

    if (specList && specList.length > 0) {
      for (let i = 0; i < specList.length; i++) {
        const spec = specList[i];
        await transaction.collection(COLL_SPEC).add({
          data: {
            spuId: id,
            specId: spec.specId,
            title: spec.title,
            values: spec.values || [],
            sortOrder: i,
          },
        });
      }
    }

    // 3. Replace SKUs
    // In transactions, bulk where().remove() is not supported. Query then loop-delete.
    const oldSkuRes = await transaction.collection(COLL_SKU).where({ spuId: id }).get();
    for (const sku of oldSkuRes.data) {
      await transaction.collection(COLL_SKU).doc(sku._id).remove();
    }

    if (skuList && skuList.length > 0) {
      for (const sku of skuList) {
        await transaction.collection(COLL_SKU).add({
          data: {
            spuId: id,
            skuId: sku.skuId,
            price: Number(sku.price),
            stock: Number(sku.stock),
            image: sku.image || primaryImage,
            specValues: sku.specValues || [],
          },
        });
      }
    }

    await transaction.commit();
    return { success: true };
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

async function deleteGoods({ id }) {
  console.log("[deleteGoods] id:", id);
  const transaction = await db.startTransaction();
  try {
    // 1. Get specs and skus inside the transaction
    const specRes = await transaction.collection(COLL_SPEC).where({ spuId: id }).get();
    const skuRes = await transaction.collection(COLL_SKU).where({ spuId: id }).get();

    // 2. Query SPU to get image/video files for deletion
    const spuDoc = await transaction.collection(COLL_SPU).doc(id).get();
    const spuData = spuDoc.data;

    // 3. Remove SPU, Spec and SKU documents
    await transaction.collection(COLL_SPU).doc(id).remove();
    for (const spec of specRes.data) {
      await transaction.collection(COLL_SPEC).doc(spec._id).remove();
    }
    for (const sku of skuRes.data) {
      await transaction.collection(COLL_SKU).doc(sku._id).remove();
    }

    await transaction.commit();

    // 4. Post-transaction: clean up home_config references
    try {
      await cleanHomeConfigReferences(id);
    } catch (configErr) {
      console.error("[deleteGoods] Failed to clean home_config references:", configErr);
    }

    // 5. Post-transaction: delete cloud storage files
    if (spuData) {
      try {
        await deleteGoodsMediaFiles(spuData, skuRes.data);
      } catch (fileErr) {
        console.error("[deleteGoods] Failed to delete cloud storage files:", fileErr);
      }
    }

    return { success: true };
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

async function cleanHomeConfigReferences(spuId) {
  const COLL_HOME_CONFIG = "home_config";
  const res = await db.collection(COLL_HOME_CONFIG).get();
  for (const doc of res.data) {
    let changed = false;
    let newSwiper = doc.swiper || [];
    let newTabList = doc.tabList || [];

    // Filter swiper
    const swiperLen = newSwiper.length;
    newSwiper = newSwiper.filter(item => item.spuId !== spuId);
    if (newSwiper.length !== swiperLen) {
      changed = true;
    }

    // Filter tabList spuIds
    for (const tab of newTabList) {
      if (tab.spuIds && tab.spuIds.includes(spuId)) {
        tab.spuIds = tab.spuIds.filter(id => id !== spuId);
        changed = true;
      }
    }

    if (changed) {
      await db.collection(COLL_HOME_CONFIG).doc(doc._id).update({
        data: {
          swiper: newSwiper,
          tabList: newTabList,
          updatedAt: Date.now()
        }
      });
      console.log(`[deleteGoods] Cleaned home_config references in doc ${doc._id}`);
    }
  }
}

async function deleteGoodsMediaFiles(spuData, skuList) {
  const fileList = [];

  // 1. primaryImage
  if (spuData.primaryImage && spuData.primaryImage.startsWith("cloud://")) {
    fileList.push(spuData.primaryImage);
  }

  // 2. images (轮播图)
  if (Array.isArray(spuData.images)) {
    spuData.images.forEach(img => {
      if (img && img.startsWith("cloud://")) {
        fileList.push(img);
      }
    });
  }

  // 3. desc (详情图/视频)
  if (Array.isArray(spuData.desc)) {
    spuData.desc.forEach(item => {
      const url = typeof item === "string" ? item : (item && item.url);
      if (url && url.startsWith("cloud://")) {
        fileList.push(url);
      }
    });
  }

  // 4. sku images
  if (Array.isArray(skuList)) {
    skuList.forEach(sku => {
      if (sku.image && sku.image.startsWith("cloud://")) {
        fileList.push(sku.image);
      }
    });
  }

  const uniqueFiles = Array.from(new Set(fileList));
  if (uniqueFiles.length > 0) {
    console.log("[deleteGoodsMediaFiles] Deleting cloud files:", uniqueFiles);
    const chunkSize = 50;
    for (let i = 0; i < uniqueFiles.length; i += chunkSize) {
      const chunk = uniqueFiles.slice(i, i + chunkSize);
      const res = await cloud.deleteFile({
        fileList: chunk,
      });
      console.log("[deleteGoodsMediaFiles] deleteFile response:", res.fileList);
    }
  }
}
