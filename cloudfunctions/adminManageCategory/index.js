const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const COLL_CATEGORY1 = "category1";
const COLL_CATEGORY2 = "category2";
const COLL_SPU = "goods_spu";
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
      case "listCategory1":
        return await listCategory1();
      case "listCategory2":
        return await listCategory2(payload);
      case "createCategory1":
        return await createCategory1(payload, adminInfo);
      case "updateCategory1":
        return await updateCategory1(payload, adminInfo);
      case "deleteCategory1":
        return await deleteCategory1(payload);
      case "createCategory2":
        return await createCategory2(payload, adminInfo);
      case "updateCategory2":
        return await updateCategory2(payload, adminInfo);
      case "deleteCategory2":
        return await deleteCategory2(payload);
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageCategory] error:", err);
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

function pickCategory1Id(category1Id) {
  if (!category1Id) return "";
  if (typeof category1Id === "string") return category1Id;
  if (typeof category1Id === "object") return category1Id._id || "";
  return "";
}

async function listCategory1() {
  const res = await db
    .collection(COLL_CATEGORY1)
    .orderBy("updatedAt", "desc")
    .limit(200)
    .get();
  return { success: true, data: { list: res.data || [] } };
}

async function listCategory2({ category1Id } = {}) {
  const c1Id = pickCategory1Id(category1Id);
  const where = c1Id
    ? _.or([{ category1Id: c1Id }, { "category1Id._id": c1Id }])
    : {};
  const res = await db
    .collection(COLL_CATEGORY2)
    .where(where)
    .orderBy("updatedAt", "desc")
    .limit(500)
    .get();
  return { success: true, data: { list: res.data || [] } };
}

async function createCategory1({ category1Name, thumbnail }, adminInfo) {
  if (!category1Name) throw new Error("分类名称不能为空");
  if (!thumbnail) throw new Error("请上传分类缩略图");

  const now = Date.now();
  const res = await db.collection(COLL_CATEGORY1).add({
    data: {
      category1Name,
      thumbnail,
      createdAt: now,
      updatedAt: now,
      createBy: adminInfo.nickName,
      updateBy: adminInfo.nickName,
    },
  });
  return { success: true, id: res._id };
}

async function updateCategory1({ id, category1Name, thumbnail }, adminInfo) {
  if (!id) throw new Error("ID required");
  if (!category1Name) throw new Error("分类名称不能为空");
  if (!thumbnail) throw new Error("请上传分类缩略图");

  await db
    .collection(COLL_CATEGORY1)
    .doc(id)
    .update({
      data: {
        category1Name,
        thumbnail,
        updatedAt: Date.now(),
        updateBy: adminInfo.nickName,
      },
    });
  return { success: true };
}

async function deleteCategory1({ id }) {
  if (!id) throw new Error("ID required");

  const category2Count = await db
    .collection(COLL_CATEGORY2)
    .where(_.or([{ category1Id: id }, { "category1Id._id": id }]))
    .count();

  if (category2Count.total > 0) {
    return { success: false, message: "该一级分类下仍有二级分类，无法删除" };
  }

  await db.collection(COLL_CATEGORY1).doc(id).remove();
  return { success: true };
}

async function createCategory2(
  { category2Name, thumbnail, category1Id },
  adminInfo
) {
  const c1Id = pickCategory1Id(category1Id);
  if (!category2Name) throw new Error("分类名称不能为空");
  if (!thumbnail) throw new Error("请上传分类缩略图");
  if (!c1Id) throw new Error("请选择所属一级分类");

  const now = Date.now();
  const res = await db.collection(COLL_CATEGORY2).add({
    data: {
      category2Name,
      thumbnail,
      category1Id: { _id: c1Id },
      createdAt: now,
      updatedAt: now,
      createBy: adminInfo.nickName,
      updateBy: adminInfo.nickName,
    },
  });
  return { success: true, id: res._id };
}

async function updateCategory2(
  { id, category2Name, thumbnail, category1Id },
  adminInfo
) {
  const c1Id = pickCategory1Id(category1Id);
  if (!id) throw new Error("ID required");
  if (!category2Name) throw new Error("分类名称不能为空");
  if (!thumbnail) throw new Error("请上传分类缩略图");
  if (!c1Id) throw new Error("请选择所属一级分类");

  await db
    .collection(COLL_CATEGORY2)
    .doc(id)
    .update({
      data: {
        category2Name,
        thumbnail,
        category1Id: { _id: c1Id },
        updatedAt: Date.now(),
        updateBy: adminInfo.nickName,
      },
    });
  return { success: true };
}

async function deleteCategory2({ id }) {
  if (!id) throw new Error("ID required");

  const goodsCount = await db
    .collection(COLL_SPU)
    .where({ categoryId: id })
    .count();
  if (goodsCount.total > 0) {
    return { success: false, message: "该二级分类下仍有关联商品，无法删除" };
  }

  await db.collection(COLL_CATEGORY2).doc(id).remove();
  return { success: true };
}
