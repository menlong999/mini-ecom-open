# 贡献指南

## 本地开发

1. 在 `miniprogram/` 目录安装依赖：

```bash
cd miniprogram
npm ci
```

2. 复制租户配置示例，并填写自己的私有参数：

```bash
mkdir -p ../tenants/<tenant>
cp ../tenants/example/tenant.config.js ../tenants/<tenant>/tenant.config.js
```

3. 生成本地运行文件：

```bash
npm run sync:tenant -- <tenant>
```

4. 用微信开发者工具打开仓库根目录。

## 提交前检查

在 `miniprogram/` 目录执行：

```bash
npm run check
```

常用命令：

- `npm run lint:fix`：修复 JS lint 问题
- `npm run format:write`：统一格式
- `npm run tenant:check`：校验默认和示例 tenant 配置结构
- `npm run cloudfunctions:check`：校验云函数命名约定与例外名单
- `npm run service-boundary:check`：校验 `app.js` 和页面层没有直接访问 CloudBase

## 租户化边界

- `tenants/<tenant>/tenant.config.js` 只放稳定的租户差异配置
- `home_config`、`store` 等运营数据保留在各租户自己的 CloudBase 数据库中
- `logistics.companies[].code` 必须与微信物流助手后台已绑定的 `deliveryId` 一致
- `project.config.json`、`miniprogram/app.json`、`miniprogram/sitemap.json`、`miniprogram/config/runtime.js`、`cloudfunctions/*/config.private.js` 都是本地生成文件，不要手改，不要提交
- 新增租户配置项时，必须同步更新：
  - `tenants/default/tenant.config.js`
  - `tenants/example/tenant.config.js`
  - `miniprogram/scripts/validate-tenant-config.js`
  - `miniprogram/scripts/sync-tenant-static.js`

## 云函数约定

- 管理端云函数统一使用 `adminManage*`
- 普通用户侧写操作统一使用 `manage*`
- 普通用户侧读操作优先留在 `miniprogram/services/`
- `app.js` 和 `pages/` 不直接调用 `wx.cloud.callFunction`、`wx.cloud.database` 或 `cloudModels`
- 只有微信 OpenAPI、工作流、回调、定时器等前端无法安全完成的能力，才保留独立云函数

## 提交规范

- 提交信息遵循 Conventional Commits
- 仓库会在 `commit-msg` 阶段执行 `commitlint`
- 如需新增数据库集合、云函数权限、或初始化数据，必须同步更新文档：
  - `DATA_MODELS.md`
  - `docs/CLOUDBASE_SETUP.md`
  - `docs/SECONDARY_DEVELOPMENT.md`
