# 常见问题 FAQ

## 项目认知

### Q：这个仓库是 SaaS 还是源码交付？

A：源码交付。每个商家独占一份代码 + 一份 CloudBase 环境。`tenants/<brand>/` 只保存与默认值的差异。

### Q：为什么不用 npm 包发布"内核 + 主题"？

A：微信小程序构建链路限制（无 webpack/vite，构建产物即源码）+ wxss 不支持 css-in-js 方案。直接源码 + overlay 是当前最务实的复用方式。

### Q：必须用 CloudBase 吗？

A：是。订单 / 售后 / 商品聚合大量依赖 CloudBase 工作流（payment.workflowName / refundWorkflowName）与 NoSQL 集合，迁移到自建后端工作量很大。

## 二次开发

### Q：我新建一个租户最少要改几项？

A：见 [tenants/example/README.md](../tenants/example/README.md) "必须改的字段"小节，最少 8 项。

### Q：默认主色蓝色，我想换品牌色？

A：在 `tenants/<brand>/tenant.config.js` 里配置 `theme` 字段；运行 `npm run sync:tenant -- <brand>` 后会写入 `miniprogram/style/theme.wxss` 的 token，全局生效，无需改具体页面。

### Q：能否只接管"我的"页头像 / 名称展示？

A：可以。改 `pages/usercenter/index.wxml` + `index.js`。但请尽量先看是否能通过 `tenant.config.js` 的 `usercenter` 字段配置达成，避免直接改内核。

### Q：如何新增一个独立页面（如"积分商城"）？

A：

1. 在 `miniprogram/pages/<your-page>/` 下新建 wxml/wxss/js/json
2. 同步注册到 [miniprogram/app.template.json](../miniprogram/app.template.json) 与 [miniprogram/sitemap.template.json](../miniprogram/sitemap.template.json)
3. 运行 `npm run sync:tenant -- <brand>` 重新生成 `app.json` / `sitemap.json`

### Q：能否禁用某个页面（如不需要分销员）？

A：当前需要从 `app.template.json` 的 `pages` 数组移除路径，并在所有指向它的入口（tabbar、跳转）中规避。后续会通过 `tenant.config.js` 的 `pages.disabled` 字段统一管理。

## 部署

### Q：每次改代码都要 rsync 吗？

A：仅当多仓维护时。单仓直接在 worktree / clone 内 `npm run sync:tenant` + 微信开发者工具上传即可。

### Q：云函数怎么发布？

A：根目录 `./uploadCloudFunction.sh` 一次性发布全部，或用 tcb 单发：`tcb fn deploy <name> -e <envId>`。

### Q：CI 里能跑 `npm run check` 吗？

A：可以。仓库已带 [.github/workflows/lint.yml](../.github/workflows/lint.yml) 在每次 PR / push 触发完整 check。

## 数据

### Q：商品数据放哪里？

A：CloudBase NoSQL `goods` / `sku` / `category` 集合。schema 见 [docs/schemas/](./schemas/) 与 [DATA_MODELS.md](../DATA_MODELS.md)。

### Q：首页 banner 配置？

A：CloudBase NoSQL `home_config` 集合，初始数据见 [cloudbase/bootstrap/home_config.example.json](../cloudbase/bootstrap/home_config.example.json)。**不要写在 `tenants/*/tenant.config.js` 里。**

### Q：数据库怎么初始化？

A：见 [docs/CLOUDBASE_SETUP.md](./CLOUDBASE_SETUP.md)。

## 其他

### Q：是否支持 H5 / App？

A：当前只面向微信小程序。Taro / uni-app 改造需大量适配，无规划。

### Q：是否兼容服务商代开发模式？

A：内核不耦合服务商模式，但需要二开者自行调整登录态获取与 CloudBase 接入方式。

### Q：遇到问题怎么办？

A：先查 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)；仍未解决请提 Issue（参见 [.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/)）。
