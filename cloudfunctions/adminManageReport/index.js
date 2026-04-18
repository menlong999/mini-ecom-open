const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const ORDER_COLLECTION = "order";
const USER_COLLECTION = "user_info";

const VALID_STATUSES = ["PENDING_DELIVERY", "PENDING_RECEIPT", "COMPLETE"];

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { action } = event || {};

  if (!openId) {
    return { success: false, message: "User not logged in" };
  }

  const adminInfo = await getAdminInfo(openId);
  if (!adminInfo) {
    return { success: false, message: "Permission denied" };
  }

  try {
    switch (action) {
      case "overview":
        return await getOverview();
      case "distributorOrders":
        return await getDistributorOrders(event.payload || {});
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (err) {
    console.error("[adminManageReport] error:", err);
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

async function getOverview() {
  const now = Date.now();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const dayRangeStart = startOfDay(addDays(now, -29));
  const monthRangeStart = startOfMonth(addMonths(now, -11));

  const orders = await fetchOrdersSince(monthRangeStart);

  const dayMap = initDayMap(dayRangeStart, 30);
  const monthMap = initMonthMap(monthRangeStart, 12);

  let dayCount = 0;
  let dayAmount = 0;
  let weekCount = 0;
  let weekAmount = 0;
  let monthCount = 0;
  let monthAmount = 0;

  orders.forEach((order) => {
    const payTime = order.payTime;
    if (!payTime) return;

    const amount = parseAmount(order);

    if (payTime >= dayStart) {
      dayCount += 1;
      dayAmount += amount;
    }
    if (payTime >= weekStart) {
      weekCount += 1;
      weekAmount += amount;
    }
    if (payTime >= monthStart) {
      monthCount += 1;
      monthAmount += amount;
    }

    if (payTime >= dayRangeStart) {
      const dayKey = formatDate(new Date(payTime), "day");
      const dayEntry = dayMap.get(dayKey);
      if (dayEntry) {
        dayEntry.orderCount += 1;
        dayEntry.salesAmount += amount;
      }
    }

    if (payTime >= monthRangeStart) {
      const monthKey = formatDate(new Date(payTime), "month");
      const monthEntry = monthMap.get(monthKey);
      if (monthEntry) {
        monthEntry.orderCount += 1;
        monthEntry.salesAmount += amount;
      }
    }
  });

  const dayRows = Array.from(dayMap.values())
    .reverse()
    .map((item) => ({
      label: item.label,
      orderCount: item.orderCount,
      salesAmount: formatAmount(item.salesAmount),
    }));

  const monthRows = Array.from(monthMap.values())
    .reverse()
    .map((item) => ({
      label: item.label,
      orderCount: item.orderCount,
      salesAmount: formatAmount(item.salesAmount),
    }));

  return {
    success: true,
    data: {
      summary: {
        day: { orderCount: dayCount, salesAmount: formatAmount(dayAmount) },
        week: { orderCount: weekCount, salesAmount: formatAmount(weekAmount) },
        month: {
          orderCount: monthCount,
          salesAmount: formatAmount(monthAmount),
        },
      },
      dayRows,
      monthRows,
    },
  };
}

async function getDistributorOrders({ openid, page = 1, pageSize = 20 }) {
  if (!openid) throw new Error("Missing distributor openid");
  const skip = (page - 1) * pageSize;

  const where = {
    distributorOpenid: openid,
    status: _.in(VALID_STATUSES),
    deleted: _.neq(true),
  };

  const countRes = await db.collection(ORDER_COLLECTION).where(where).count();
  const total = countRes.total || 0;

  const listRes = await db
    .collection(ORDER_COLLECTION)
    .where(where)
    .orderBy("payTime", "desc")
    .skip(skip)
    .limit(pageSize)
    .get();

  const list = (listRes.data || []).map((order) => ({
    _id: order._id,
    orderNo: order.orderNo || "",
    deliveryType: order.deliveryType,
    createdAt: order.createdAt,
    payTime: order.payTime,
    orderSummary: order.orderSummary || {},
    goodsList: order.goodsList || [],
    userAddress: order.userAddress || null,
    pickupStore: order.pickupStore || null,
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

async function fetchOrdersSince(startTs) {
  const where = {
    status: _.in(VALID_STATUSES),
    payTime: _.gte(startTs),
    deleted: _.neq(true),
  };

  const pageSize = 100;
  let page = 0;
  let hasMore = true;
  const list = [];

  while (hasMore) {
    const res = await db
      .collection(ORDER_COLLECTION)
      .where(where)
      .orderBy("payTime", "desc")
      .skip(page * pageSize)
      .limit(pageSize)
      .get();

    const data = res.data || [];
    list.push(...data);
    hasMore = data.length === pageSize;
    page += 1;
  }

  return list;
}

function parseAmount(order) {
  const summary = order.orderSummary || {};
  const raw = summary.totalPayAmount || summary.totalSalePrice || 0;
  const amount = parseFloat(raw);
  return Number.isNaN(amount) ? 0 : amount;
}

function formatAmount(amount) {
  return Number(amount || 0).toFixed(2);
}

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts) {
  const d = new Date(ts);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday as first day
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfMonth(ts) {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(ts, days) {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

function addMonths(ts, months) {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

function formatDate(date, type) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  if (type === "month") return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

function initDayMap(startTs, days) {
  const map = new Map();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(startTs + i * 24 * 60 * 60 * 1000);
    const label = formatDate(date, "day");
    map.set(label, { label, orderCount: 0, salesAmount: 0 });
  }
  return map;
}

function initMonthMap(startTs, months) {
  const map = new Map();
  const startDate = new Date(startTs);
  for (let i = 0; i < months; i += 1) {
    const date = new Date(startDate.getTime());
    date.setMonth(startDate.getMonth() + i);
    const label = formatDate(date, "month");
    map.set(label, { label, orderCount: 0, salesAmount: 0 });
  }
  return map;
}
