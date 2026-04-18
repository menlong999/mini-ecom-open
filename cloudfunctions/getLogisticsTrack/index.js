const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

exports.main = async (event, context) => {
  const { logisticsNo, companyCode, companyName } = event;
  const { OPENID } = cloud.getWXContext();

  console.log("Fetching logistics for:", {
    logisticsNo,
    companyCode,
    companyName,
    OPENID,
  });

  try {
    // 调用微信物流助手接口查询轨迹
    // 文档: https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/logistics/logistics.getPath.html
    const result = await cloud.openapi.logistics.getPath({
      openid: OPENID,
      deliveryId: companyCode, // 快递公司ID，如 SF, ZTO
      waybillId: logisticsNo, // 运单号
    });

    console.log("Logistics API Result:", result);

    if (result.errCode !== 0) {
      throw new Error(result.errMsg);
    }

    return {
      code: "Success",
      msg: "查询成功",
      data: {
        logisticsNo,
        company: companyName,
        nodes: (result.pathItemList || []).map((item) => ({
          title: item.actionMsg || "",
          desc: item.actionMsg || "", // 微信返回的 msg 通常包含地点和状态
          date: new Date(item.actionTime * 1000).toLocaleString(),
          icon: "circle", // 默认圆点，前端可以根据状态优化图标
        })),
        raw: result, // 返回原始数据以供调试
      },
    };
  } catch (err) {
    console.error("Logistics API Error:", err);

    // 如果查询失败，返回模拟数据或空数据，避免页面报错
    // 这里仅为了演示，实际应根据业务决定是否返回错误
    return {
      code: "Error",
      msg: "物流信息查询失败: " + (err.message || "未知错误"),
      data: {
        logisticsNo,
        company: companyName,
        nodes: [],
        error: err.message,
      },
    };
  }
};
