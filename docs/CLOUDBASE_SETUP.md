# CloudBase 接入与初始化

## 前提

每个 tenant 使用独立的 CloudBase 环境。

初始化一个新 tenant 时，需要准备：

- CloudBase 环境
- 微信小程序 `appid`
- 支付工作流名称
- 退款工作流名称
- 首页装修数据
- 自提门店数据

## 还需要用户自行开通的平台能力

开源仓库不会代替租户完成微信侧的平台接入。以下能力需要每个租户自行在微信/CloudBase 平台开通并配置：

- 微信支付工作流：用于 `unifiedOrder`
- 微信退款工作流：用于 `adminManageAfterService.refund`
- 微信物流助手：用于 `getLogisticsTrack`
- 手机号授权 OpenAPI：用于 `login`
- 小程序码 OpenAPI：用于 `generateQRCode`

其中物流轨迹查询还有一个额外前提：

- `tenants/<tenant>/tenant.config.js` 中 `logistics.companies[].code` 必须和微信物流助手后台已绑定的物流公司 `deliveryId` 一致
- 只建议保留当前租户实际启用、且已完成绑定的物流公司

## 必填配置

1. 复制示例配置：

```bash
mkdir -p tenants/<tenant>
cp tenants/example/tenant.config.js tenants/<tenant>/tenant.config.js
```

2. 至少补齐以下字段：

- `cloud.envId`
- `wechat.appId`
- `wechat.projectName`
- `payment.workflowName`
- `payment.refundWorkflowName`
- `afterService.returnAddress`

3. 生成本地运行文件：

```bash
cd miniprogram
npm run sync:tenant -- <tenant>
```

## 云函数开放能力

以下云函数目录内的 `config.json` 需要保留，对应 CloudBase OpenAPI 权限：

- `cloudfunctions/login/config.json`
  - `phonenumber.getPhoneNumber`
- `cloudfunctions/getLogisticsTrack/config.json`
  - `logistics.getPath`
- `cloudfunctions/generateQRCode/config.json`
  - `wxacode.getUnlimited`

## CloudBase 权限建议

建议按“前端只读自己数据 + 管理写操作走云函数”配置数据权限：

- `order`、`after-service`、`address`、`cart`、`user_info`
  - 仅允许用户读取自己的记录
  - 不直接开放前端写权限
- `home_config`、`store`
  - 允许前端只读
  - 后台修改继续通过管理端云函数或 CloudBase 控制台完成
- 商品、分类、SKU、评价
  - 按业务需要开放前端读取
  - 管理写操作继续通过 `adminManage*` 云函数完成

更细一点的建议基线：

- `goods_spu`、`goods_sku`、`goods_spec`、`category2`
  - 前端可读
  - 管理写走 `adminManageGoods` / `adminManageCategory`
- `comments`
  - 前端可读
  - 用户新增评价走 `manageComments`
  - 如后续增加后台审核/删除，也走 `adminManage*`
- `cart`
  - 前端只读自己的数据
  - 增删改走 `manageCart`
- `address`
  - 前端只读自己的数据
  - 增删改与默认地址切换走 `manageAddress`
- `order`
  - 前端只读自己的数据
  - 创建走 `createOrder`
  - 取消、删除、确认收货走 `manageOrder`
  - 支付参数走 `unifiedOrder`
- `after-service`
  - 前端只读自己的数据
  - 申请、撤销、回填物流走 `manageAfterService`
  - 管理审核/退款/收货异常处理走 `adminManageAfterService`
- `user_info`
  - 前端只读自己的数据
  - 登录/手机号绑定走 `login`
  - 普通资料更新走 `manageUser`
- `home_config`、`store`
  - 前端只读
  - 后台运营配置走管理端 service + 云函数

如果前端直接读自己的业务数据，代码层也必须继续补 `_openid` 过滤，不要只依赖数据库权限兜底。

## 数据库集合

核心集合：

- `goods_spu`
- `goods_sku`
- `goods_spec`
- `category2`
- `cart`
- `order`
- `after-service`
- `address`
- `comments`
- `user_info`

运营数据集合：

- `home_config`
- `store`

## 初始化建议

必须预置：

- 至少一条 `home_config`
- 至少一个启用中的 `store`

推荐预置：

- 管理员用户记录（首次登录后再把 `user_info.role` 调整为 `admin`）
- 基础商品、分类、SKU 数据

仓库内提供了示例种子数据：

- [cloudbase/bootstrap/home_config.example.json](../cloudbase/bootstrap/home_config.example.json)
- [cloudbase/bootstrap/store.example.json](../cloudbase/bootstrap/store.example.json)

这些文件适合导入新环境后再按租户实际业务修改。

## 环境文件

- `cloudbaserc.json`：CloudBase 部署模板，不包含真实环境 ID
- `project.config.template.json`：微信开发者工具模板，不包含真实 `appid`

不要提交以下本地文件：

- `project.config.json`
- `miniprogram/app.json`
- `miniprogram/sitemap.json`
- `miniprogram/config/runtime.js`
- `cloudfunctions/*/config.private.js`
- `tenants/<private-tenant>/tenant.config.js`
