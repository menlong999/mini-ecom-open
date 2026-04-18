# 开源准备清单

## 已完成

- 租户私有配置与开源主干解耦
- 本地生成文件加入 `.gitignore`
- 支付、退款、二维码配置已抽到 tenant 配置
- 首页配置与自提门店保留在各 tenant 的 CloudBase 数据库
- 默认 tenant 与示例 tenant 已拆分
- GitHub Actions 已接入 lint、format、tenant 校验
- commitlint 已接入本地 `commit-msg` hook
- CloudBase 初始化与二开边界文档已补齐
- 微信平台能力的开通前置条件已纳入文档说明

## 当前仓库建议保持的文档集合

- `README.md`
- `DATA_MODELS.md`
- `docs/ARCHITECTURE.md`
- `docs/CLOUDBASE_SETUP.md`
- `docs/SECONDARY_DEVELOPMENT.md`
- `CONTRIBUTING.md`

## 仍建议补充

- 首页、商品详情、管理后台的截图或录屏
- Issue Template / Pull Request Template
- 发布说明与版本变更日志
- 更系统的自动化测试
- CloudBase 集合索引清单
- 面向二开者的 tenant 脚手架命令

## 发布前人工检查

- 检查仓库中没有提交 `project.config.json`
- 检查仓库中没有提交 `miniprogram/app.json`
- 检查仓库中没有提交 `miniprogram/sitemap.json`
- 检查仓库中没有提交 `miniprogram/config/runtime.js`
- 检查仓库中没有提交 `cloudfunctions/*/config.private.js`
- 检查仓库中没有提交私有 tenant 目录
- 检查 README 与 docs 中没有租户私有信息
