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
    // Note: Real production code might want diffing to preserve strict IDs if external refs exist.
    await transaction.collection(COLL_SPEC).where({ spuId: id }).remove();
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
    await transaction.collection(COLL_SKU).where({ spuId: id }).remove();
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
    await transaction.collection(COLL_SPU).doc(id).remove();
    await transaction.collection(COLL_SPEC).where({ spuId: id }).remove();
    await transaction.collection(COLL_SKU).where({ spuId: id }).remove();
    await transaction.commit();
    return { success: true };
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}
