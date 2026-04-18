const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

let privateConfig = {};
try {
  privateConfig = require("./config.private.js");
} catch (error) {
  privateConfig = {};
}

const db = cloud.database();
const qrcodeConfig = privateConfig.qrcode || {};

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  try {
    // 0. 检查用户是否已通过分销审核
    const userRes = await db
      .collection("user_info")
      .where({ _openid: openId })
      .limit(1)
      .get();
    let user = userRes.data && userRes.data.length ? userRes.data[0] : null;
    const now = Date.now();

    if (!user) {
      await db.collection("user_info").add({
        data: {
          _openid: openId,
          nickName: "微信用户",
          avatarUrl: "",
          phoneNumber: "",
          distributorStatus: "PENDING",
          distributorApplyAt: now,
          createdAt: now,
          updatedAt: now,
        },
      });
      return {
        code: 202,
        message: "已提交分销申请，请等待审核",
        data: { status: "PENDING" },
      };
    }

    const status = user.distributorStatus;
    const isApproved = status === "APPROVED" || user.role === "distributor";
    if (!isApproved) {
      if (status !== "PENDING") {
        await db
          .collection("user_info")
          .where({ _openid: openId })
          .update({
            data: {
              distributorStatus: "PENDING",
              distributorApplyAt: now,
              distributorRejectReason: "",
              distributorRejectedAt: null,
              updatedAt: now,
            },
          });
      }

      return {
        code: 202,
        message:
          status === "PENDING" ? "分销审核中" : "已提交分销申请，请等待审核",
        data: { status: "PENDING" },
      };
    }

    // 1. 检查云存储中是否已存在该用户的二维码
    const cloudPathPrefix = qrcodeConfig.cloudPathPrefix || "qrcodes";
    const cloudPath = `${cloudPathPrefix}/${openId}.png`;

    // 尝试获取临时链接，如果成功说明文件存在 (虽然 getTempFileURL 并不校验文件存在性，但通常配合 stat 使用，这里我们简化逻辑：
    // 直接覆盖生成，或者如果追求性能，可以先 stat。为了逻辑简单和确保最新，这里选择生成后覆盖或利用云存储同名覆盖特性)
    // 但为了避免频繁调用 acode 接口（有频率限制），最好还是检查一下。
    // 由于 wechat-server-sdk 没有直接的 stat 方法（通常用 database 或 storage API），
    // 我们可以尝试直接生成并上传，覆盖旧的。如果需要优化，可以在 user_info 表里存一个 qrcode_file_id。

    // 2. 调用 wx.acode.getUnlimited 生成小程序码
    // scene 参数最大32个可见字符，只支持数字，大小写英文以及部分特殊字符
    // 这里直接使用 openId 作为 scene 可能过长（OpenID通常28位，刚刚好，但若有变动需注意）
    // page 必须是已经发布的小程序存在的页面（否则报错），开发阶段可以使用 pages/home/home 之类
    //如果不传 page，默认是主页
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: `d=${openId}`,
      page: qrcodeConfig.page || "pages/home/home",
      checkPath:
        qrcodeConfig.checkPath === undefined ? false : !!qrcodeConfig.checkPath,
      envVersion: qrcodeConfig.envVersion || "develop",
      width: Number(qrcodeConfig.width) || 430,
    });

    if (result.errCode) {
      throw new Error(`Generate acode failed: ${result.errMsg}`);
    }

    // 3. 上传图片到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: result.buffer,
    });

    console.log("Upload success:", uploadResult);

    await db
      .collection("user_info")
      .where({ _openid: openId })
      .update({
        data: {
          distributorQrFileId: uploadResult.fileID,
          updatedAt: Date.now(),
        },
      });

    return {
      code: 0,
      message: "success",
      data: {
        fileID: uploadResult.fileID,
        status: "APPROVED",
      },
    };
  } catch (err) {
    console.error("Generate User QRCode failed:", err);
    return {
      code: -1,
      message: "Generate failed",
      error: err,
    };
  }
};
