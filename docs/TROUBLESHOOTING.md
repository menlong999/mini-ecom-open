# 故障排查 TROUBLESHOOTING

## 启动 / 编译

### `Error: Cannot find module 'xxx'`（小程序内）

- 没跑 `npm run sync:tenant -- <brand>`，导致 `config/runtime.js` 缺失。
- 微信开发者工具未"构建 npm"。打开开发者工具 → 工具 → 构建 npm。

### 微信开发者工具白屏 / `app.json` 找不到 `pages`

- 你直接编辑了 `app.json`。规则：**只改 `app.template.json`**，`app.json` 由 `sync:tenant` 生成，且在 `.gitignore` 中。
- 复跑：`cd miniprogram && npm run sync:tenant -- <brand>`。

### 真机预览样式异常 / 图片加载不出

- 检查 `tenants/<brand>/tenant.config.js` 中的 CDN / 图床域名是否已加入小程序后台"服务器域名"。
- 检查 `wx.cloud.init` 是否成功（控制台搜 "cloudbase"）。

## 登录 / 鉴权

### `登录失败 / openId 为空`

1. `tenant.config.js` 的 `cloudbase.envId` 是否正确？
2. 小程序后台是否开通了云开发？
3. `cloudfunctions/login` 是否已部署？复跑 `./uploadCloudFunction.sh login`。

### 管理端 `权限不足 (403)`

- `users` 集合中，对应 openId 的 `role` 字段需为 `admin` 或 `superAdmin`。
- 进 CloudBase 控制台手动改一下，或用 [docs/CLOUDBASE_SETUP.md](./CLOUDBASE_SETUP.md) 的初始化脚本。

## 订单 / 支付

### 微信支付下单失败 `workflow not found`

- `tenant.config.js` 的 `payment.workflowName` 与 CloudBase 控制台已发布的工作流名严格一致（含大小写）。
- 工作流尚未发布或被改名。

### 支付回调没触发

- 检查 `cloudfunctions/paymentCallback` 是否部署且配置了正确的 HTTP 触发器。
- CloudBase 控制台 → 函数日志查看入参。

### 订单超时未自动取消

- `cancelOrderTimer` 云函数定时触发器是否启用？默认 cron `0 */10 * * * *`（每 10 分钟）。

## 数据 / 接口

### 商品列表为空

- `goods` 集合是否已写入数据？参考 [DATA_MODELS.md](../DATA_MODELS.md) 的 schema。
- 商品 `status` 字段是否为 `on_sale`？前端默认只查上架商品。

### `Error: permission denied` 读集合

- CloudBase 安全规则没放行。最小集合权限：`true` 或 `auth.openid != null`，按业务收紧。

## CI / 提交

### `npm run check` 在本机过，CI 失败

- Node 版本不一致。本仓固定 Node 18（见 `.nvmrc` 与 `engines`）。`nvm use` 后再试。
- 没提交 `package-lock.json`。

### husky 拒绝提交：`检测到租户私有目录被加入提交`

- 你正在尝试把 `tenants/<非 default/example>/` 文件入库，**这是设计上禁止的**。
- 真要提交：把这些文件移到独立私有仓库；只通过本地路径或 submodule 引入。详见 [tenants/example/README.md](../tenants/example/README.md)。

### `git commit` 报 commitlint

- 提交信息须符合 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：`type(scope): subject`。
- 推荐用 `npx cz` 交互式生成。

## 二次开发

### 改了主色但页面没变

- 你改的是页面 wxss 里的硬编码色？应改 `tenant.config.js` 的 `theme` → 跑 `sync:tenant`。
- 所有页面 wxss 已迁移到 token。如发现有遗漏的硬编码色，欢迎提 PR（`npm run style:check` 会守住一部分历史色板）。

### 我加了页面但 sitemap 不收录

- 同步改 `sitemap.template.json`，再 `npm run sync:tenant`。

## 还是没解决？

带上：

- 微信开发者工具基础库版本
- Node 版本
- 复现步骤
- 控制台 / 云函数日志截图

去 [GitHub Issues](https://github.com/menlong999/mini-ecom-open/issues) 报。
