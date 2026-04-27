# 架构说明

## 总体结构

项目采用三层结构：

- Cloud 层：CloudBase 数据模型与云函数，负责权限校验、库存、订单、售后、支付、退款
- Service 层：小程序侧的数据适配与云函数调用封装
- Page 层：页面渲染与交互

## 读写边界

用户端默认遵守以下规则：

- 写操作进入云函数，避免前端直接拿到超出本人权限的写能力
- 普通读操作优先放在 `miniprogram/services/`，直接结合 CloudBase 数据权限读取
- 只有涉及服务端能力、OpenAPI、或前端无法安全完成的读操作，才保留在云函数

当前按这个规则拆分后的典型示例：

- 用户地址、订单详情、售后列表、售后详情：在小程序 `services/` 中直接读，并附带 `_openid` 约束
- 用户地址写入、订单取消/确认收货、售后申请/撤销/填写物流、创建订单：走 `manage*` 或特殊写云函数，再由 service 封装调用
- 物流轨迹查询：保留在云函数 `getLogisticsTrack`，因为它依赖微信物流助手 OpenAPI
- 管理端商品、订单、售后、报表、首页装修：无论读写都保留在 `adminManage*` 云函数

这套规则成立的前提是：CloudBase 权限模型必须同时收紧，确保用户端只能读自己的业务数据，不能直接读写其他用户数据。

另外，`app.js` 和 `pages/` 不应直接调用 `wx.cloud.callFunction`、`wx.cloud.database` 或 `cloudModels`。这些调用统一先进入 `miniprogram/services/`，仓库内已通过 `npm run service-boundary:check` 做静态校验。

## 云函数命名约定

本仓库约定如下：

- 管理端云函数统一使用 `adminManage*`
- 普通用户侧写操作统一使用 `manage*`
- 少数有明确平台语义的特殊函数保留独立命名

当前保留的特殊函数包括：

- `login`
- `createOrder`
- `unifiedOrder`
- `paymentCallback`
- `refundCallback`
- `generateQRCode`
- `getLogisticsTrack`
- `cancelOrderTimer`
- `confirmReceiptTimer`

不再保留“用户侧普通读写但名字不在约定内”的云函数。比如售后申请、撤销、填写物流已经统一收敛到 `manageAfterService`，售后列表与详情读取已经回到小程序 `services/`。

## 租户化边界

本仓库采用“开源内核 + 租户私有配置”模式，而不是长期维护业务分支。

适合进入 `tenants/<tenant>/tenant.config.js` 的内容：

- 品牌文案
- CloudBase 环境 ID
- 微信小程序 `appid`
- 支付/退款工作流名称
- 二维码参数
- 客服信息
- 物流公司列表
- 运费规则
- 售后退货地址
- 售后原因列表
- 发票开关与发票须知
- 默认资源兜底配置
- 功能开关

不进入 tenant 配置、仍保留在各租户 CloudBase 数据库中的内容：

- 首页装修 `home_config`
- 自提门店 `store`
- 商品、库存、分类
- 用户、订单、售后业务数据

## 配置生成链路

1. 公共默认值定义在 `tenants/default/tenant.config.js`
2. 每个租户只覆盖差异值，放在 `tenants/<tenant>/tenant.config.js`
3. `miniprogram/scripts/sync-tenant-static.js` 合并配置并生成本地运行文件
4. 生成文件全部加入 `.gitignore`

当前生成产物：

- `miniprogram/config/runtime.js`
- `miniprogram/app.json`
- `miniprogram/sitemap.json`
- `project.config.json`
- `cloudfunctions/unifiedOrder/config.private.js`
- `cloudfunctions/adminManageAfterService/config.private.js`
- `cloudfunctions/generateQRCode/config.private.js`
- `cloudfunctions/createOrder/config.private.js`

## 支付与金额边界

- 订单金额以云函数 `createOrder` 的服务端计算结果为准
- 支付金额以云函数 `unifiedOrder` 从订单记录读取的金额为准，不信任客户端传参
- 退款金额不得超过 `wechatPayInfo.totalFee`

这三条是开源主干必须保持的安全边界。
