const cloud = require("wx-server-sdk");
const { init } = require("./wxCloudClientSDK.umd.js");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 初始化数据模型 SDK
init(cloud);

/**
 * 登录云函数：
 * 支持两种模式：
 * 1. 基础登录 (无参数)：获取/创建用户，绑定 OpenID。
 * 2. 获取手机号 (phoneCode 参数)：解密手机号并更新到用户信息。
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const referrerOpenid = event && event.referrerOpenid;
  const referrerScene = event && event.referrerScene;
  const shouldUpdateReferrer = referrerOpenid && referrerOpenid !== openid;

  try {
    // ------------------------------------------------------------
    // 模式 1: 获取并更新手机号 (如果前端传入 phoneCode)
    // ------------------------------------------------------------
    if (event.phoneCode) {
      console.log("正在获取手机号，Code:", event.phoneCode);

      const res = await cloud.openapi.phonenumber.getPhoneNumber({
        code: event.phoneCode,
      });
      console.log("getPhoneNumber raw response:", JSON.stringify(res));

      const phoneInfo = res.phoneInfo || {};
      const phoneNumber = phoneInfo.phoneNumber;

      console.log("Parsed phoneNumber:", phoneNumber);

      if (phoneNumber) {
        // 更新用户信息
        const updateRes = await cloud.models.user_info.update({
          filter: {
            where: {
              $and: [{ _openid: { $eq: openid } }],
            },
          },
          data: {
            phoneNumber: phoneNumber,
          },
        });
        console.log("User update response:", updateRes);

        return {
          code: 200,
          message: "手机号获取并更新成功",
          data: { phoneNumber },
        };
      } else {
        console.error("Failed to extract phone number from response", res);
        return { code: 400, message: "无法解析手机号", detail: res };
      }
    }

    // ------------------------------------------------------------
    // 模式 2: 默认静默登录 (获取或创建用户)
    // ------------------------------------------------------------
    const userRes = await cloud.models.user_info.list({
      filter: {
        where: {
          $and: [
            {
              _openid: { $eq: openid },
            },
          ],
        },
      },
      pageSize: 1,
      pageNumber: 1,
    });

    const userList = userRes.data.records || [];

    if (userList.length > 0) {
      // 用户已存在，直接返回
      const user = userList[0];
      if (shouldUpdateReferrer) {
        await cloud.models.user_info.update({
          filter: {
            where: {
              $and: [{ _openid: { $eq: openid } }],
            },
          },
          data: {
            referrerOpenid,
            referrerScene: referrerScene || "",
            referrerAt: Date.now(),
          },
        });
        user.referrerOpenid = referrerOpenid;
        user.referrerScene = referrerScene || "";
        user.referrerAt = Date.now();
      }
      console.log("用户已存在:", user);
      return {
        code: 200,
        message: "登录成功",
        data: user,
      };
    } else {
      // 用户不存在，创建新用户
      const newUser = {
        _openid: openid,
        nickName: "微信用户",
        avatarUrl: "",
        phoneNumber: "",
      };
      if (shouldUpdateReferrer) {
        newUser.referrerOpenid = referrerOpenid;
        newUser.referrerScene = referrerScene || "";
        newUser.referrerAt = Date.now();
      }

      const addUserRes = await cloud.models.user_info.create({
        data: newUser,
      });

      return {
        code: 201,
        message: "新用户注册成功",
        data: {
          id: addUserRes.data.id,
          ...newUser,
        },
      };
    }
  } catch (err) {
    console.error("云函数执行出错:", err);
    return {
      code: 500,
      message: "执行失败",
      error: err.message || err,
    };
  }
};
