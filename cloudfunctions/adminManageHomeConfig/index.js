const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

const USER_COLLECTION = "user_info";
const HOME_CONFIG_COLLECTION = "home_config";

exports.main = async (event) => {
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
      case "get":
        return await getHomeConfig();
      case "save":
        return await saveHomeConfig(payload, adminInfo);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageHomeConfig] error:", err);
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
  return {
    openId,
    nickName: user.nickName || "管理员",
  };
}

function normalizeConfig(raw = {}) {
  const swiper = Array.isArray(raw.swiper)
    ? raw.swiper
        .map((item) => ({
          image: (item && (item.image || item.imageUrl)) || "",
          spuId: (item && (item.spuId || item.skuId)) || "",
        }))
        .filter((item) => item.image || item.spuId)
    : [];

  const tabList = Array.isArray(raw.tabList)
    ? raw.tabList
        .map((item) => ({
          text: (item && item.text) || "",
          spuIds: Array.isArray(item && item.spuIds) ? item.spuIds : [],
        }))
        .filter((item) => item.text || (item.spuIds && item.spuIds.length))
    : [];

  return {
    ...raw,
    swiper,
    tabList,
  };
}

async function getHomeConfig() {
  const res = await db
    .collection(HOME_CONFIG_COLLECTION)
    .orderBy("updatedAt", "desc")
    .limit(1)
    .get();
  const list = (res && res.data) || [];
  const config = list.length ? normalizeConfig(list[0]) : null;
  return { success: true, data: { config } };
}

function validateHomeConfigPayload({ tabList, swiper } = {}) {
  if (tabList !== undefined && !Array.isArray(tabList)) {
    throw new Error("tabList must be an array");
  }
  if (swiper !== undefined && !Array.isArray(swiper)) {
    throw new Error("swiper must be an array");
  }

  (tabList || []).forEach((tab, idx) => {
    const text = tab && tab.text;
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new Error(`tabList[${idx}].text required`);
    }
    const spuIds = tab && tab.spuIds;
    if (spuIds !== undefined && !Array.isArray(spuIds)) {
      throw new Error(`tabList[${idx}].spuIds must be an array`);
    }
    (spuIds || []).forEach((id, j) => {
      if (!id || typeof id !== "string") {
        throw new Error(`tabList[${idx}].spuIds[${j}] invalid`);
      }
    });
  });

  (swiper || []).forEach((item, idx) => {
    const image = item && item.image;
    const spuId = item && item.spuId;
    if (!image || typeof image !== "string") {
      throw new Error(`swiper[${idx}].image required`);
    }
    if (!spuId || typeof spuId !== "string") {
      throw new Error(`swiper[${idx}].spuId required`);
    }
  });
}

async function saveHomeConfig(payload = {}, adminInfo) {
  const now = Date.now();
  const { id, searchPlaceholder = "", tabList = [], swiper = [] } = payload;

  const normalized = {
    searchPlaceholder:
      typeof searchPlaceholder === "string" ? searchPlaceholder : "",
    tabList: Array.isArray(tabList)
      ? tabList.map((t) => ({
          text: (t && t.text) || "",
          spuIds: Array.isArray(t && t.spuIds) ? t.spuIds : [],
        }))
      : [],
    swiper: Array.isArray(swiper)
      ? swiper.map((s) => ({
          image: (s && (s.image || s.imageUrl)) || "",
          spuId: (s && (s.spuId || s.skuId)) || "",
        }))
      : [],
  };

  validateHomeConfigPayload(normalized);

  let targetId = id;
  if (!targetId) {
    const existed = await db
      .collection(HOME_CONFIG_COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();
    const list = (existed && existed.data) || [];
    targetId = list.length ? list[0]._id : "";
  }

  if (targetId) {
    await db
      .collection(HOME_CONFIG_COLLECTION)
      .doc(targetId)
      .update({
        data: {
          ...normalized,
          updatedAt: now,
          updateBy: adminInfo.nickName,
        },
      });
    return { success: true };
  }

  const addRes = await db.collection(HOME_CONFIG_COLLECTION).add({
    data: {
      ...normalized,
      createdAt: now,
      updatedAt: now,
      createBy: adminInfo.nickName,
      updateBy: adminInfo.nickName,
      owner: adminInfo.openId,
    },
  });

  return { success: true, id: addRes._id };
}
