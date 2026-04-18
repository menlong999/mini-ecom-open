const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const COLL_SPU = "goods_spu";
const COLL_SKU = "goods_sku";
const COLL_SPEC = "goods_spec";
const COLL_CATEGORY2 = "category2";
const USER_COLLECTION = "user_info";

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action, payload = {} } = event || {};

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
        return await listStock(payload);
      case "addStock":
        return await addStock(payload, adminInfo);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageStock] error:", err);
    return { success: false, message: err.message || "Internal error" };
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
  return { openId, nickName: user.nickName || "管理员" };
}

async function listStock({
  page = 1,
  pageSize = 20,
  keyword = "",
  category1Id = "",
  category2Id = "",
}) {
  const skip = (page - 1) * pageSize;
  const where = {};

  if (keyword && keyword.trim()) {
    where.title = db.RegExp({ regexp: keyword.trim(), options: "i" });
  }

  if (category2Id) {
    where.categoryId = category2Id;
  } else if (category1Id) {
    const c2Res = await db
      .collection(COLL_CATEGORY2)
      .where(_.or([{ category1Id }, { "category1Id._id": category1Id }]))
      .get();
    const category2Ids = (c2Res.data || []).map((item) => item._id);
    if (!category2Ids.length) {
      return { success: true, data: { list: [], total: 0, page, pageSize } };
    }
    where.categoryId = _.in(category2Ids);
  }

  const countRes = await db.collection(COLL_SPU).where(where).count();
  const total = countRes.total || 0;

  const spuRes = await db
    .collection(COLL_SPU)
    .where(where)
    .orderBy("updatedAt", "desc")
    .skip(skip)
    .limit(pageSize)
    .get();

  const spuList = spuRes.data || [];
  if (!spuList.length) {
    return { success: true, data: { list: [], total, page, pageSize } };
  }

  const spuIds = spuList.map((item) => item._id);

  const [skuRes, specRes] = await Promise.all([
    db
      .collection(COLL_SKU)
      .where({ spuId: _.in(spuIds) })
      .get(),
    db
      .collection(COLL_SPEC)
      .where({ spuId: _.in(spuIds) })
      .get(),
  ]);

  const skuList = skuRes.data || [];
  const specList = specRes.data || [];

  const specMap = buildSpecMap(specList);
  const skuMap = skuList.reduce((acc, sku) => {
    const list = acc[sku.spuId] || [];
    list.push({
      skuId: sku.skuId,
      stock: Number(sku.stock || 0),
      specText: buildSpecText(specMap[sku.spuId], sku.specValues || []),
    });
    acc[sku.spuId] = list;
    return acc;
  }, {});

  const list = spuList.map((spu) => ({
    _id: spu._id,
    title: spu.title,
    categoryId: spu.categoryId,
    spuStockQuantity: Number(spu.spuStockQuantity || 0),
    skuList: skuMap[spu._id] || [],
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

function buildSpecMap(specList) {
  const map = {};
  specList.forEach((spec) => {
    const spuId = spec.spuId;
    if (!spuId) return;
    if (!map[spuId]) map[spuId] = {};
    const valuesMap = (spec.values || []).reduce((acc, item) => {
      if (item && item.valueId) acc[item.valueId] = item.value || "";
      return acc;
    }, {});
    map[spuId][spec.specId] = {
      title: spec.title || "",
      values: valuesMap,
    };
  });
  return map;
}

function buildSpecText(specMap = {}, specValues = []) {
  if (!specValues.length) return "默认";
  const parts = specValues
    .map((item) => {
      const specInfo = specMap[item.specId] || {};
      const valueText =
        (specInfo.values && specInfo.values[item.specValueId]) ||
        item.specValueId ||
        "";
      return specInfo.title ? `${specInfo.title}:${valueText}` : valueText;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" / ") : "默认";
}

async function addStock({ skuId, amount }, adminInfo) {
  const addAmount = Number(amount);
  if (!skuId) throw new Error("缺少 skuId");
  if (!Number.isInteger(addAmount) || addAmount <= 0)
    throw new Error("请输入大于0的整数");

  const skuRes = await db.collection(COLL_SKU).where({ skuId }).limit(1).get();
  const sku = skuRes.data && skuRes.data.length ? skuRes.data[0] : null;
  if (!sku) throw new Error("SKU 不存在");
  if (!sku.spuId) throw new Error("SKU 缺少 spuId");

  const now = Date.now();
  const transaction = await db.startTransaction();
  try {
    await transaction
      .collection(COLL_SKU)
      .doc(sku._id)
      .update({
        data: {
          stock: _.inc(addAmount),
          updatedAt: now,
        },
      });
    await transaction
      .collection(COLL_SPU)
      .doc(sku.spuId)
      .update({
        data: {
          spuStockQuantity: _.inc(addAmount),
          updatedAt: now,
        },
      });
    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
