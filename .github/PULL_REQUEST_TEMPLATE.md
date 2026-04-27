<!--
感谢贡献！合并前请逐项确认下方清单，并简要描述本次变更。
-->

## 变更类型

- [ ] 🐛 Bug 修复
- [ ] ✨ 新功能
- [ ] 📝 文档
- [ ] 🎨 样式 / 视觉
- [ ] ♻️ 重构（无功能变化）
- [ ] ⚡️ 性能
- [ ] 🔧 工具 / 构建
- [ ] 🚨 破坏性变更（需在描述中详细说明迁移方式）

## 变更摘要

<!-- 简述这次 PR 做了什么、为什么这么做。关联 issue 用 Closes #xxx -->

## 影响范围

- [ ] miniprogram（前端页面 / 组件 / services）
- [ ] cloudfunctions（云函数）
- [ ] tenants（租户配置 schema 或 default/example）
- [ ] docs / scripts / CI

## 提交前检查

- [ ] 已运行 `cd miniprogram && npm run check`，全部通过
- [ ] 没有引入任何租户私有数据（仅 `tenants/default` 与 `tenants/example` 应被改动）
- [ ] 没有引入 `console.log`（保留 `console.warn` / `console.error`）
- [ ] 颜色 / 字号 / 间距均通过 `miniprogram/style/theme.wxss` 的 token，未使用裸十六进制
- [ ] 如新增页面：已同步 `miniprogram/app.template.json` 与 `miniprogram/sitemap.template.json`
- [ ] 如新增云函数：已遵循 `adminManage*` / `manage*` / 已知例外名单的命名规范
- [ ] 如改动数据模型：已同步 `docs/schemas/` 与 `DATA_MODELS.md`
- [ ] 已更新 / 新增对应文档（如有用户可见行为变化）

## 截图 / 录屏（视觉变更必填）

<!-- 拖入图片或粘贴链接 -->
