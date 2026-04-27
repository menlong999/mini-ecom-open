# tenants/example —— 租户脚手架

这个目录是给二次开发者复制的**最小可用模板**。开源主仓只保留 `tenants/default`（公共默认值）与 `tenants/example`（脚手架），其他 `tenants/*` 都会被 `.gitignore` 忽略，不会进入版本控制。

## 五分钟新建一个租户

```bash
# 1. 复制脚手架
cp -R tenants/example tenants/<your-brand>

# 2. 编辑租户配置（仅写差异项，未填字段自动继承 tenants/default）
$EDITOR tenants/<your-brand>/tenant.config.js

# 3. 生成本地运行时文件（前端 + 云函数 private 配置）
cd miniprogram
npm run sync:tenant -- <your-brand>

# 4. 校验配置合法
npm run tenant:validate -- <your-brand>

# 5. 在微信开发者工具中打开 miniprogram/，正常预览/上传
```

## 必须改的字段

最小可运行需要在 `tenant.config.js` 里覆盖以下几项：

| 字段 | 说明 |
| --- | --- |
| `tenantId` | 租户标识（小写英文，唯一） |
| `brand.name` / `brand.shortName` | 品牌名 / 短名 |
| `cloudbase.envId` | 你的 CloudBase 环境 ID |
| `wechat.appId` | 小程序 AppID |
| `payment.workflowName` | 支付下单工作流名（CloudBase 控制台） |
| `payment.refundWorkflowName` | 退款工作流名 |
| `logistics.companies` | 物流商列表（如不需要可留空数组） |
| `afterService.returnAddress` | 售后退货地址 |

其余字段都有合理默认，一般无需修改。

## 哪些值不要写在这里？

下列内容**不属于租户配置**，应放在 CloudBase 数据库 / 控制台中维护，避免敏感数据进入代码仓：

- 首页 banner / 商品分组 / 推荐位 → `home_config` 集合
- 自提门店 / 客服联系方式 → `store` 集合
- 商品 / 库存 / 价格 → `goods` / `sku` 集合
- 订单 / 售后 → 各业务集合

## 安全提示

- `tenants/<your-brand>/` 目录已被 `.gitignore` 自动忽略，提交前用 `git status` 复核。
- husky pre-commit 钩子会拒绝任何 `tenants/<非 default/example>` 路径下的文件提交。
- 切勿把真实 envId / appId / 手机号 / 真实地址写到 `tenants/example/`。

## 可选：私有租户独立仓库

如果你长期维护多个客户，推荐把每个 `tenants/<brand>/` 单独做成 **私有 git 仓库**，再用 `git submodule` 或本地软链接的方式挂回主仓 `tenants/` 下。这样：

- 升级开源主干时不会冲突到私有目录
- 私有目录的提交历史与主仓物理隔离
- 给开源主仓提 PR 时永远不会带出客户数据

更详细的二次开发约束参见 [docs/SECONDARY_DEVELOPMENT.md](../../docs/SECONDARY_DEVELOPMENT.md)。
