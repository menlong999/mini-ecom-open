# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added
- 设计 token 体系（`miniprogram/style/theme.wxss`），统一品牌色板 / 字号 / 间距 / 阴影 / 遮罩
- 13 张数据模型 schema 与 TypeScript 定义同步到 `docs/schemas/`
- `npm run style:check` 检测遗留视觉色块（如旧蓝、旧橙、bright green switch 等）
- `SECURITY.md` / `CODE_OF_CONDUCT.md` / GitHub issue & PR 模板
- husky pre-commit 防止租户私有目录误提交
- `docs/FAQ.md` 与 `docs/TROUBLESHOOTING.md`
- `miniprogram/utils/logger.js` 轻量日志封装（debug 模式可控，warn/error 始终输出）
- `.github/workflows/release.yml`：按 tag 自动跑 quality gate 并发布 GitHub Release

### Changed
- 全量页面 / 组件 wxss 替换硬编码颜色为 token；wxml 内联属性色对齐 token 近似值
- README 顶部新增"私有租户管理"指引
- `tenants/example` 增加完整脚手架步骤说明
- ESLint 规则收紧：`no-console` 仅允许 `warn` / `error`（warn 级别，不阻断 CI）；`no-debugger` 设为 error

### Removed
- `CODEBUDDY.md` / `MEMO.md`（AI 辅助开发的私有指令，不属于公开文档）

## [1.0.1]

参见 git 历史。
