# 二次开发约束

## 先判断改动归属

新增需求前，先判断它属于哪一层：

- 租户稳定配置：放 `tenants/<tenant>/tenant.config.js`
- 运营数据：放 CloudBase 数据库
- 公共业务能力：直接进开源主干
- 客户专属功能：优先做功能开关，其次再考虑独立模块

## 不允许的做法

- 不要把 `home_config` 和 `store` 搬回本地配置
- 不要把品牌、工作流、地址、电话继续硬编码到页面或云函数源码
- 不要直接手改生成文件
- 不要用长期业务分支维护客户差异
- 不要让客户端决定支付金额或退款上限

## 云函数拆分规则

- 管理端功能无论读写，都放在 `adminManage*` 云函数
- 普通用户侧写操作，放在 `manage*` 云函数
- 普通用户侧读操作，优先放在 `miniprogram/services/`
- `app.js` 和 `pages/` 不直接访问 `wx.cloud.callFunction`、`wx.cloud.database` 或 `cloudModels`
- 只有调用微信 OpenAPI、工作流、定时器或其他前端无法安全完成的能力，才保留独立云函数

当前允许的特殊云函数类型：

- 登录：`login`
- 下单/支付/回调：`createOrder`、`unifiedOrder`、`paymentCallback`、`refundCallback`
- 平台能力：`generateQRCode`、`getLogisticsTrack`
- 定时器：`cancelOrderTimer`、`confirmReceiptTimer`

如果新增一个云函数既不是管理端，也不是上面的特殊类型，默认应该优先考虑合并进现有 `manage*` 体系。

仓库已内置 `npm run cloudfunctions:check`，会校验当前 `cloudfunctions/` 目录是否满足这套命名约定。
仓库也已内置 `npm run service-boundary:check`，会校验页面层和 `app.js` 没有绕过 service 直接访问 CloudBase。

## 新增配置项时的规则

如果要新增 tenant 配置：

1. 先加到 `tenants/default/tenant.config.js`
2. 再补 `tenants/example/tenant.config.js`
3. 更新 `miniprogram/scripts/validate-tenant-config.js`
4. 更新 `miniprogram/scripts/sync-tenant-static.js`
5. 如果云函数要用，再生成对应 `config.private.js`
6. 更新文档

## 新增运营数据时的规则

如果新增的是运营数据集合：

- 在 `DATA_MODELS.md` 记录字段
- 在 `docs/CLOUDBASE_SETUP.md` 记录初始化要求
- 如适合模板化，补一份 `cloudbase/bootstrap/*.example.json`

## 订单与支付的硬约束

- 价格、库存、运费必须以服务端计算为准
- 订单创建阶段不得信任客户端汇总金额
- 支付阶段不得信任客户端传入金额
- 退款阶段不得超过支付回调写入的 `wechatPayInfo.totalFee`

## 推荐的扩展方式

- 新租户：新增 `tenants/<tenant>/tenant.config.js`
- 新功能开关：放在 `features`
- 新售后品牌差异：放在 `afterService`
- 新支付/二维码参数：放在 `payment` / `qrcode`
- 新运营页面数据：走 CloudBase 集合，不走本地配置
