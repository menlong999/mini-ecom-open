# 安全策略 Security Policy

## 支持的版本

| 版本 | 是否支持安全更新 |
| --- | --- |
| 1.x  | ✅ |
| < 1.0 | ❌ |

## 报告漏洞

如果你发现了安全漏洞，**请不要在公开 issue 中披露**，以免被恶意利用。

请通过以下方式私下联系维护者：

- 在 GitHub 仓库 Settings → Security → Report a vulnerability 提交私密报告
- 或发送邮件至仓库维护者邮箱（见 `package.json` 的 `author` 字段）

我们会在 **72 小时内** 回应，并在确认问题后协调修复与公开披露时间表。

## 报告内容建议

请尽量包含：

1. 受影响的版本
2. 漏洞类型与潜在影响（数据泄露 / 越权 / 注入 / DoS 等）
3. 复现步骤或最小复现工程
4. 你的 PoC（如有）
5. 建议的修复方案（可选）

## 已知的边界

本项目是一个微信小程序前端 + 云函数后端的电商内核，使用方需自行负责：

- CloudBase 环境的 IAM、安全规则与权限配置
- 自有租户私有配置（`tenants/<tenant>/`、`config.private.js`）的保密
- 微信小程序 AppID/AppSecret、支付商户号等密钥的存储

仓库提供的 `npm run check` 包含：

- `tenant-boundary:check` 防止租户私有数据写入开源主干
- `service-boundary:check` 防止页面层直接调用 CloudBase 读写 API
- `cloudfunctions:check` 校验云函数命名规范

但这些只是工程边界，不是安全审计。生产部署前请自行进行渗透测试与权限复核。
