# 微信小程序云开发实战课程

> 基于 mini-ecom-open（极简电商小程序）工程，面向零基础成年人/大学生的完整小程序开发课程

## 课程特色

- **零基础友好**：从注册账号到发布上线，全流程手把手教学
- **AI 驱动开发**：集成 CodeBuddy、MCP、OpenSpec 等 AI 工作流
- **实战导向**：基于可上线发布的"校园咖啡"电商小程序
- **开箱即用**：提供完整的 AI 规则包、种子数据、部署脚本

---

## 第一部分：认知篇

### 第 1 章：小程序的基本原理

#### 1.1 小程序是什么

小程序是一种不需要下载安装即可使用的应用，它实现了应用"触手可及"的梦想，用户扫一扫或搜一下即可打开应用。

**小程序 vs H5 vs App 对比：**

| 特性 | 小程序 | H5 | App |
|------|--------|-----|-----|
| 安装 | 无需安装 | 无需安装 | 需要安装 |
| 体验 | 接近原生 | 一般 | 原生 |
| 开发成本 | 中 | 低 | 高 |
| 能力 | 微信API | 有限 | 完整 |
| 分享 | 微信内传播 | 链接分享 | 应用商店 |

#### 1.2 双线程模型

小程序采用双线程架构：

```
┌─────────────────────────────────────────┐
│                  小程序                   │
├─────────────────┬───────────────────────┤
│    渲染层        │       逻辑层           │
│  (WebView)      │    (JsCore)           │
│                 │                       │
│  WXML + WXSS    │    JS (App/Page)      │
│                 │                       │
└────────┬────────┴───────────┬───────────┘
         │                    │
         └──── Native 层 ─────┘
              (微信客户端)
```

- **渲染层**：负责 UI 渲染，运行在 WebView 中
- **逻辑层**：负责数据处理、API 调用，运行在 JsCore 中
- **Native 层**：微信客户端提供的能力（支付、分享、相机等）

**为什么要双线程？**
- 安全：JS 无法直接操作 DOM，防止恶意代码
- 性能：渲染和逻辑分离，避免卡顿
- 体验：接近原生 App 的流畅度

#### 1.3 文件结构

每个小程序页面由 4 个文件组成：

```
pages/
└── home/
    ├── home.js        # 页面逻辑
    ├── home.json      # 页面配置
    ├── home.wxml      # 页面结构（类似 HTML）
    └── home.wxss      # 页面样式（类似 CSS）
```

| 文件 | 作用 | 类比 Web |
|------|------|----------|
| `.wxml` | 页面结构 | HTML |
| `.wxss` | 页面样式 | CSS |
| `.js` | 页面逻辑 | JavaScript |
| `.json` | 页面配置 | 无 |

#### 1.4 生命周期

小程序有三个层级的生命周期：

**应用生命周期（app.js）：**
```javascript
App({
  onLaunch() {
    // 小程序初始化时触发（全局只触发一次）
    console.log('小程序启动')
  },
  onShow() {
    // 小程序显示时触发（从后台切到前台）
  },
  onHide() {
    // 小程序隐藏时触发（从前台切到后台）
  }
})
```

**页面生命周期：**
```javascript
Page({
  onLoad(options) {
    // 页面加载时触发（只触发一次）
    // options 包含页面参数
  },
  onShow() {
    // 页面显示时触发
  },
  onReady() {
    // 页面初次渲染完成时触发
  },
  onHide() {
    // 页面隐藏时触发
  },
  onUnload() {
    // 页面卸载时触发
  }
})
```

**组件生命周期：**
```javascript
Component({
  lifetimes: {
    attached() {
      // 组件实例进入页面节点树时触发
    },
    detached() {
      // 组件实例被从页面节点树移除时触发
    }
  }
})
```

#### 1.5 实践：浏览 mini-ecom-open 项目结构

```bash
# 克隆项目
git clone https://github.com/your-username/mini-ecom-open.git
cd mini-ecom-open

# 查看目录结构
tree -L 2 -I node_modules
```

**核心目录说明：**

```
mini-ecom-open/
├── cloudfunctions/        # 云函数目录
│   ├── login/             # 登录函数
│   ├── createOrder/       # 创建订单
│   └── ...                # 共 23 个云函数
├── miniprogram/           # 小程序前端
│   ├── pages/             # 页面
│   ├── services/          # 服务层
│   ├── components/        # 组件
│   └── config/            # 配置
├── tenants/               # 多租户配置
└── cloudbaserc.json       # 云开发配置
```

**练习：**
1. 用微信开发者工具打开项目
2. 浏览 `miniprogram/pages/home/` 目录，理解首页结构
3. 打开 `miniprogram/app.js`，观察云开发初始化代码

---

### 第 2 章：微信开发者工具介绍

#### 2.1 安装与登录

**下载地址：** https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

**安装步骤：**
1. 选择对应操作系统版本（Windows/Mac）
2. 下载后直接安装
3. 使用微信扫码登录

#### 2.2 项目导入

**导入步骤：**
1. 打开微信开发者工具
2. 点击「+」号，导入项目
3. 选择项目目录（mini-ecom-open 根目录）
4. 填入 AppID（或使用测试号）
5. 点击「导入」

**项目配置文件（project.config.json）：**
```json
{
  "appid": "your-appid",
  "projectname": "mini-ecom-open",
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  }
}
```

#### 2.3 开发者工具界面

**主界面分区：**

```
┌─────────────────────────────────────────────────────┐
│  菜单栏                                              │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  模拟器   │              编辑器                       │
│          │                                          │
│  (预览)   │         (代码编写区域)                     │
│          │                                          │
├──────────┴──────────────────────────────────────────┤
│  调试器                                             │
│  ┌─────┬───────┬─────────┬───────┬────────┐        │
│  │Console│Network│AppData│Storage│Source  │        │
│  └─────┴───────┴─────────┴───────┴────────┘        │
└─────────────────────────────────────────────────────┘
```

#### 2.4 调试器使用

**Console 面板：**
- 查看 `console.log()` 输出
- 执行 JavaScript 代码
- 查看错误信息

```javascript
// 试试在 Console 中执行
wx.getSystemInfoSync()
getCurrentPages()
```

**Network 面板：**
- 查看网络请求
- 分析请求耗时
- 查看请求/响应数据

**Storage 面板：**
- 查看本地存储（wx.setStorageSync）
- 调试数据持久化

**AppData 面板：**
- 实时查看页面数据
- 修改数据并预览效果

#### 2.5 云开发控制台

**入口：** 工具栏 → 云开发

**功能模块：**
- **数据库**：查看/编辑集合数据
- **云存储**：管理上传的文件
- **云函数**：查看/部署/调试云函数
- **监控**：查看调用量、错误率

#### 2.6 真机调试

**预览方式：**
1. **预览**：生成二维码，手机扫码预览
2. **真机调试**：手机端运行，电脑端调试
3. **远程调试**：同时调试多个设备

**操作步骤：**
1. 点击工具栏「预览」或「真机调试」
2. 手机微信扫描二维码
3. 在电脑端查看调试信息

**练习：**
1. 导入 mini-ecom-open 项目
2. 在模拟器中浏览首页、分类页、购物车
3. 打开 Console，查看日志输出
4. 打开 Network，观察页面加载的网络请求

---

### 第 3 章：账号与环境准备

#### 3.1 个人测试 AppID 申请

**适用场景：** 学习、开发、测试

**申请步骤：**
1. 访问 https://mp.weixin.qq.com
2. 点击「立即注册」
3. 选择「小程序」类型
4. 使用邮箱注册（未注册过公众号/小程序）
5. 完成邮箱验证
6. 选择「个人」类型
7. 填写个人信息，完成注册

**获取 AppID：**
1. 登录小程序后台
2. 左侧菜单 → 开发 → 开发管理
3. 开发设置 → AppID

**测试号说明：**
- 无需审核，直接使用
- 部分接口受限（如支付、物流）
- 适合开发调试

#### 3.2 正式 AppID 申请

**适用场景：** 商业运营、上线发布

**主体类型：**

| 主体类型 | 所需材料 | 支付能力 |
|---------|---------|---------|
| 个人 | 身份证 | ❌ 不支持 |
| 个体工商户 | 营业执照 + 身份证 | ✅ 支持 |
| 企业 | 营业执照 + 对公账户 | ✅ 支持 |

**申请步骤（以个体工商户为例）：**
1. 准备营业执照照片
2. 准备法人身份证正反面照片
3. 登录 mp.weixin.qq.com 注册
4. 选择「个体工商户」
5. 填写主体信息，上传证件
6. 微信认证（300 元/年）
7. 审核通过后获取 AppID

#### 3.3 云开发环境开通

**开通步骤：**
1. 用微信开发者工具打开项目
2. 点击工具栏「云开发」
3. 首次使用会提示开通
4. 选择「免费版」或「基础版」
5. 等待环境初始化完成

**环境配置：**
- **环境 ID**：如 `cloud1-xxx`，用于代码中指定环境
- **环境名称**：便于识别，如 `dev`、`prod`
- **地域**：建议选择「华东（上海）」

**获取环境 ID：**
```javascript
// 方法 1：云开发控制台查看
// 方法 2：代码获取
wx.cloud.init({ env: 'your-env-id' })
```

#### 3.4 配置项目环境

**创建租户配置：**
```bash
# 复制示例配置
cp -R tenants/example tenants/my-coffee

# 编辑配置文件
vi tenants/my-coffee/tenant.config.js
```

**tenant.config.js 内容：**
```javascript
module.exports = {
  brandName: '校园咖啡',
  envId: 'cloud1-xxxxxxxx',    // 你的云开发环境 ID
  appId: 'wx1234567890abcdef', // 你的 AppID
  // ... 其他配置
}
```

**生成运行配置：**
```bash
npm run sync:tenant -- my-coffee
```

**练习：**
1. 注册一个个人测试小程序账号
2. 获取 AppID
3. 开通云开发环境
4. 配置项目并成功运行

---

## 第二部分：AI 开发工具篇

### 第 4 章：AI 开发小程序的前置工作

#### 4.1 开发工具选择

**工具对比：**

| 工具 | 特点 | 适用场景 |
|------|------|---------|
| **CodeBuddy** | 微信官方插件，深度集成小程序 API | 专注小程序开发 |
| **Claude Code** | 强大的代码理解和生成能力 | 复杂逻辑、架构设计 |
| **Cursor** | IDE 集成，实时补全 | 日常编码 |
| **GitHub Copilot** | VS Code 插件，代码补全 | 通用开发 |

**推荐组合：**
- **初学者**：CodeBuddy（微信开发者工具内置）
- **进阶**：Claude Code + CodeBuddy
- **效率**：Cursor + CodeBuddy

#### 4.2 MCP 配置

**什么是 MCP？**

MCP（Model Context Protocol）是一个开放协议，允许 AI 模型与外部工具/数据源交互。

**CloudBase MCP：**

让 AI 具备直接操作云开发的能力：
- 查询/修改云数据库
- 部署云函数
- 管理云存储
- 配置安全规则

**配置文件（.mcp.json）：**
```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"]
    },
    "tdesign": {
      "command": "npx",
      "args": ["-y", "tdesign-mcp-server"]
    }
  }
}
```

**TDesign MCP：**

让 AI 获取精准的 TDesign 组件文档：
- 组件属性说明
- 使用示例
- 变更日志
- DOM 结构

**使用示例：**
```
用户：帮我用 TDesign 的按钮组件实现一个提交按钮
AI：（通过 TDesign MCP 获取 Button 组件文档）
   <t-button theme="primary" bindtap="onSubmit">提交</t-button>
```

#### 4.3 AI Skills/Rules 体系

**什么是 Skills/Rules？**

预定义的规则文件，告诉 AI 在特定场景下如何工作，确保输出符合项目规范。

**mini-ecom-open 的 23 个规则文件：**

```
rules/
├── miniprogram-development/   # 小程序开发规范
├── cloud-functions/           # 云函数开发规范
├── ui-design/                 # UI 设计规范
├── spec-workflow/             # 需求规格流程
├── ai-model-cloudbase/        # CloudBase AI 模型
├── ai-model-nodejs/           # Node.js AI 模型
├── ai-model-wechat/           # 微信 AI 模型
└── ...                        # 更多规则
```

**规则示例（miniprogram-development）：**
- 页面必须包含 4 个文件（js/json/wxml/wxss）
- 使用 TDesign 组件而非自定义
- 数据请求封装在 services/ 目录
- 页面禁止直接调用 wx.cloud

**配置方式：**

```bash
# CodeBuddy 配置
cp -R rules/ .codebuddy/rules/

# Claude Code 配置
cp -R rules/ .claude/rules/
```

#### 4.4 CLAUDE.md / AGENTS.md 开箱即用

**CLAUDE.md 的作用：**

项目根目录的配置文件，告诉 AI：
- 项目概述
- 技术栈
- 目录结构
- 开发规范
- 常用命令

**mini-ecom-open 的 CLAUDE.md 模板：**
```markdown
# 项目说明

## 技术栈
- 前端：微信小程序原生 + TDesign
- 后端：微信云开发 + 云函数
- 数据库：CloudBase FlexDB

## 开发规范
- 页面禁止直接调用 wx.cloud
- 写操作走 manage* 云函数
- 管理端走 adminManage* 云函数

## 常用命令
- npm run check          # 全部检查
- npm run sync:tenant    # 同步租户配置
- npm run lint:check     # ESLint 检查
```

**AGENTS.md 的作用：**

定义 AI Agent 的行为规范：
- 代码风格偏好
- 提交信息格式
- 测试要求
- 文档要求

**实践：创建自己的配置文件**
```bash
# 从模板创建
cp CLAUDE.example.md CLAUDE.md
cp AGENTS.example.md AGENTS.md

# 修改为你的配置
vi CLAUDE.md
```

#### 4.5 OpenSpec 工作流

**什么是 OpenSpec？**

一种结构化的需求描述方式，让 AI 理解需求并生成实现方案。

**工作流程：**
```
需求描述 → AI 分析 → 生成规格文档 → AI 实现 → 代码审查
```

**示例：实现商品搜索功能**

**Step 1：需求描述**
```markdown
## 需求：商品搜索

用户可以在首页搜索商品，支持：
- 关键词搜索（标题、描述）
- 按分类筛选
- 按价格排序
- 分页加载
```

**Step 2：AI 生成规格**
```markdown
## 技术规格

### 前端
- 搜索组件：使用 TDesign Search 绑定输入事件
- 列表页：新增 /pages/goods/search 页面
- 服务层：services/good/searchGoods.js

### 后端
- 云函数：复用现有 goods 查询，增加搜索条件
- 数据库：在 goods_spu 的 title 字段建立索引
```

**Step 3：AI 实现代码**
```javascript
// services/good/searchGoods.js
const searchGoods = async (keyword, category, sort, page) => {
  const app = getApp()
  const filter = {
    $and: [
      { isPutOnSale: true },
      { title: { $regex: keyword } }
    ]
  }
  if (category) filter.$and.push({ category2Id: category })
  
  const res = await app.cloudModels.goods_spu.list({
    filter: { where: filter },
    orderBy: sort === 'price' ? { minSalePrice: 'asc' } : { createdAt: 'desc' },
    pageSize: 20,
    pageNumber: page
  })
  return res.data
}
```

**练习：**
1. 配置 MCP（CloudBase + TDesign）
2. 导入项目的 rules/ 目录
3. 创建 CLAUDE.md 配置文件
4. 用 OpenSpec 流程实现一个"商品收藏"功能

---

## 第三部分：脚手架篇

### 第 5 章：项目脚手架与组织形式

#### 5.1 完整目录结构

```
mini-ecom-open/
├── .github/                          # GitHub 配置
│   ├── workflows/                    # CI/CD 工作流
│   │   ├── lint.yml                 # 代码检查
│   │   └── release.yml              # 发布流程
│   ├── ISSUE_TEMPLATE/              # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md     # PR 模板
│
├── cloudfunctions/                   # 云函数目录（23 个）
│   ├── login/                       # 用户登录
│   │   ├── index.js                # 函数逻辑
│   │   ├── config.json             # 函数配置
│   │   └── package.json            # 依赖
│   ├── createOrder/                 # 创建订单（事务）
│   ├── unifiedOrder/                # 统一下单（支付）
│   ├── paymentCallback/             # 支付回调
│   ├── manageCart/                  # 购物车管理
│   ├── manageAddress/               # 地址管理
│   ├── manageOrder/                 # 订单管理
│   ├── adminManageGoods/            # 管理端-商品
│   ├── adminManageOrder/            # 管理端-订单
│   └── ...                          # 更多云函数
│
├── miniprogram/                      # 小程序前端
│   ├── app.js                       # 应用入口
│   ├── app.json                     # 应用配置
│   ├── app.wxss                     # 全局样式
│   │
│   ├── pages/                       # 页面目录
│   │   ├── home/                   # 首页
│   │   ├── category/               # 分类页
│   │   ├── cart/                   # 购物车
│   │   ├── goods/                  # 商品模块（分包）
│   │   │   ├── details/           # 商品详情
│   │   │   ├── list/              # 商品列表
│   │   │   └── comments/          # 评论
│   │   ├── order/                  # 订单模块（分包）
│   │   │   ├── order-confirm/     # 订单确认
│   │   │   ├── order-list/        # 订单列表
│   │   │   └── order-detail/      # 订单详情
│   │   ├── usercenter/            # 个人中心
│   │   └── admin/                  # 管理端（分包）
│   │       ├── dashboard/         # 管理台
│   │       ├── goods/             # 商品管理
│   │       └── order/             # 订单管理
│   │
│   ├── services/                    # 服务层
│   │   ├── _utils/                 # 工具函数
│   │   ├── common/                 # 公共服务（登录等）
│   │   ├── good/                   # 商品服务
│   │   ├── cart/                   # 购物车服务
│   │   ├── order/                  # 订单服务
│   │   ├── address/                # 地址服务
│   │   └── admin/                  # 管理端服务
│   │
│   ├── components/                  # 公共组件
│   │   ├── load-more/              # 加载更多
│   │   ├── price/                  # 价格展示
│   │   └── webp-image/             # WebP 图片
│   │
│   ├── custom-tab-bar/             # 自定义 TabBar
│   ├── config/                     # 配置目录
│   ├── style/                      # 样式目录
│   └── utils/                      # 工具类
│
├── tenants/                          # 多租户配置
│   ├── default/                    # 默认配置
│   │   └── tenant.config.js
│   ├── example/                    # 示例配置
│   │   └── tenant.config.js
│   └── <your-brand>/               # 你的品牌配置
│       └── tenant.config.js
│
├── docs/                             # 文档目录
│   ├── ARCHITECTURE.md             # 架构说明
│   ├── DATA_MODELS.md              # 数据模型
│   ├── DESIGN_SYSTEM.md            # 设计系统
│   └── FAQ.md                      # 常见问题
│
├── rules/                            # AI 规则文件
│
├── cloudbase/                        # 云开发配置
│   └── bootstrap/                  # 种子数据
│       ├── category1.mock.json
│       ├── goods_spu.mock.json
│       └── ...
│
├── cloudbaserc.json                  # CloudBase 部署配置
├── project.config.json               # 开发者工具配置（本地生成）
├── package.json                      # 根目录配置
├── .mcp.json                         # MCP 配置
├── .husky/                           # Git hooks
├── .gitignore
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

#### 5.2 多租户机制

**设计思想：**
- 开源内核 + 私有 overlay
- 一套代码，多个品牌
- 敏感配置不入库

**配置层级：**
```
tenants/default/     → 公共默认值
tenants/example/     → 脚手架模板
tenants/deshan/      → 德善礼仪（私有，.gitignore）
tenants/your-brand/  → 你的品牌（私有，.gitignore）
```

**tenant.config.js 内容：**
```javascript
module.exports = {
  // 品牌信息
  brandName: '校园咖啡',
  slogan: '每一杯都是新鲜烘焙',
  
  // 环境配置
  envId: 'cloud1-xxxxxxxx',
  appId: 'wx1234567890abcdef',
  
  // 支付配置
  paymentWorkflow: 'your-payment-workflow',
  refundWorkflow: 'your-refund-workflow',
  
  // 客服信息
  customerServicePhone: '400-xxx-xxxx',
  
  // 物流公司
  logisticsCompanies: [
    { code: 'YTO', name: '圆通速递' },
    { code: 'ZTO', name: '中通快递' }
  ],
  
  // 功能开关
  features: {
    distributor: true,    // 分销功能
    invoice: false,       // 发票功能
    logistics: true       // 物流功能
  }
}
```

**同步命令：**
```bash
npm run sync:tenant -- your-brand
```

**生成的文件（.gitignore）：**
- `miniprogram/config/runtime.js`
- `miniprogram/app.json`
- `project.config.json`
- `cloudfunctions/*/config.private.js`

#### 5.3 npm scripts 说明

```json
{
  "scripts": {
    "check": "运行所有检查",
    "lint:check": "ESLint 代码检查",
    "format:check": "Prettier 格式检查",
    "cloudfunctions:check": "云函数命名检查",
    "service-boundary:check": "服务边界检查",
    "tenant-boundary:check": "租户边界检查",
    "style:check": "样式检查",
    "sync:tenant": "同步租户配置",
    "prepare": "安装 husky hooks"
  }
}
```

**使用示例：**
```bash
# 全部检查
npm run check

# 只检查 ESLint
npm run lint:check

# 同步租户配置
npm run sync:tenant -- my-coffee
```

#### 5.4 实践：配置自己的租户

**Step 1：创建租户目录**
```bash
cp -R tenants/example tenants/campus-coffee
```

**Step 2：编辑配置**
```javascript
// tenants/campus-coffee/tenant.config.js
module.exports = {
  brandName: '校园咖啡',
  envId: 'cloud1-your-env-id',
  appId: 'wx-your-app-id',
  // ...
}
```

**Step 3：同步配置**
```bash
npm run sync:tenant -- campus-coffee
```

**Step 4：运行项目**
```bash
# 微信开发者工具中点击「编译」
```

---

### 第 6 章：前后端功能分离

#### 6.1 三层架构（Cloud-Service-Page）

```
┌─────────────────────────────────────────────────────┐
│                    Page 层                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  home   │ │ category│ │  cart   │  ...           │
│  └────┬────┘ └────┬────┘ └────┬────┘               │
│       │           │           │                     │
├───────┴───────────┴───────────┴─────────────────────┤
│                  Service 层                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ good    │ │ cart    │ │ order   │ │ address │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       │           │           │           │        │
├───────┴───────────┴───────────┴───────────┴────────┤
│                   Cloud 层                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ 云函数       │  │ 云数据库     │  │ 云存储      ││
│  │ callFunction │  │ FlexDB      │  │ Storage     ││
│  └─────────────┘  └─────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────┘
```

**各层职责：**

| 层级 | 职责 | 示例 |
|------|------|------|
| **Page 层** | UI 渲染、用户交互、数据绑定 | 首页展示商品列表 |
| **Service 层** | 数据请求封装、数据清洗、状态转换 | 获取商品列表、格式化价格 |
| **Cloud 层** | 业务逻辑、权限校验、数据存储 | 创建订单、扣减库存 |

#### 6.2 读写边界约束

**核心原则：**

```
读操作 → Service 层直连数据库（配合权限过滤）
写操作 → 云函数封装（权限校验在服务端）
```

**具体规则：**

| 操作类型 | 位置 | 示例 |
|---------|------|------|
| 用户读自己的数据 | `services/` 直连 | 查看订单列表、地址列表 |
| 用户写操作 | `manage*` 云函数 | 添加购物车、修改地址 |
| 管理端操作 | `adminManage*` 云函数 | 商品管理、订单发货 |
| 涉及第三方 API | 独立云函数 | 支付、物流查询 |

**为什么这样设计？**

1. **安全性**：写操作必须在服务端校验权限
2. **性能**：读操作直连数据库，减少一次云函数调用
3. **可维护性**：逻辑分层清晰，易于排查问题

#### 6.3 命名约定

**云函数命名：**
```javascript
// 用户侧写操作：manage*
manageCart          // 购物车管理
manageAddress       // 地址管理
manageOrder         // 订单管理
manageAfterService  // 售后管理

// 管理端操作：adminManage*
adminManageGoods        // 商品管理
adminManageOrder        // 订单管理
adminManageAfterService // 售后管理
adminManageCategory     // 分类管理

// 特殊函数：独立命名
login               // 登录
createOrder         // 创建订单（事务）
unifiedOrder        // 统一下单（支付）
paymentCallback     // 支付回调
refundCallback      // 退款回调
```

**为什么统一命名？**
- 便于理解函数用途
- 便于自动化检查（`npm run cloudfunctions:check`）
- 便于 AI 理解代码结构

#### 6.4 实践：分析数据流

**场景：首页商品列表加载**

```javascript
// 1. Page 层：home.js
Page({
  data: {
    goodsList: [],
    loading: false
  },
  
  onLoad() {
    this.loadGoods()
  },
  
  async loadGoods() {
    this.setData({ loading: true })
    // 调用 Service 层
    const goods = await fetchGoodsList({ page: 1 })
    this.setData({ 
      goodsList: goods,
      loading: false 
    })
  }
})

// 2. Service 层：services/good/fetchGoodsList.js
const fetchGoodsList = async (params) => {
  const app = getApp()
  // 直连数据库查询（读操作）
  const res = await app.cloudModels.goods_spu.list({
    filter: { 
      where: { isPutOnSale: true } 
    },
    pageSize: 20,
    pageNumber: params.page
  })
  // 数据清洗
  return res.data.records.map(formatGoodsData)
}

// 3. Cloud 层：CloudBase 数据库
// goods_spu 集合，权限设置为「所有用户可读，仅管理员可写」
```

**数据流向：**
```
Page (home.js)
  → Service (fetchGoodsList.js)
    → CloudBase (goods_spu.list())
      → 返回数据
    → 格式化数据
  → 更新页面
```

---

## 第四部分：云开发篇

### 第 7 章：微信云开发概述

#### 7.1 云开发 vs 自建服务器

| 对比项 | 云开发 | 自建服务器 |
|-------|--------|----------|
| 服务器 | 无需购买 | 需要购买/租赁 |
| 运维 | 微信托管 | 自行维护 |
| 成本 | 按量付费，有免费额度 | 固定成本 |
| 扩展 | 自动扩容 | 手动扩容 |
| 微信集成 | 深度集成 | 需要对接 |
| 开发效率 | 高 | 中 |

**云开发核心能力：**

```
┌─────────────────────────────────────────┐
│              微信云开发                    │
├─────────────┬─────────────┬─────────────┤
│   云函数     │   云数据库    │   云存储     │
│  Functions  │  Database   │  Storage    │
│             │             │             │
│ Node.js     │ FlexDB      │ 文件/图片    │
│ 事件触发     │ 文档型       │ CDN加速     │
│ 定时任务     │ JSON格式     │ 临时链接     │
└─────────────┴─────────────┴─────────────┘
```

#### 7.2 云函数（Cloud Functions）

**什么是云函数？**
- 运行在云端的 JavaScript 代码
- 无需管理服务器
- 按调用次数计费
- 自动扩缩容

**云函数结构：**
```javascript
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  // 查询用户是否存在
  const user = await db.collection('user_info')
    .where({ _openid: OPENID })
    .get()
  
  if (user.data.length === 0) {
    // 创建新用户
    await db.collection('user_info').add({
      data: {
        _openid: OPENID,
        nickName: '新用户',
        createdAt: db.serverDate()
      }
    })
  }
  
  return { openid: OPENID }
}
```

**配置文件：**
```json
// cloudfunctions/login/config.json
{
  "permissions": {
    "openapi": [
      "auth.getPhoneNumber"
    ]
  }
}
```

#### 7.3 云数据库（FlexDB）

**什么是 FlexDB？**
- 文档型数据库（类似 MongoDB）
- JSON 格式存储
- 无固定 Schema
- 内置权限控制

**数据结构示例：**
```javascript
// goods_spu 集合
{
  "_id": "spu_001",
  "_openid": "admin_openid",
  "spuId": "SPU001",
  "title": "美式咖啡",
  "primaryImage": "cloud://xxx/americano.png",
  "minSalePrice": 15.00,
  "isPutOnSale": true,
  "categoryId": "cat_coffee",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**CRUD 操作：**
```javascript
// 查询
const res = await db.collection('goods_spu')
  .where({ isPutOnSale: true })
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get()

// 新增
await db.collection('goods_spu').add({
  data: {
    title: '新品咖啡',
    price: 18.00,
    createdAt: db.serverDate()
  }
})

// 更新
await db.collection('goods_spu')
  .doc('spu_001')
  .update({
    data: { price: 20.00 }
  })

// 删除
await db.collection('goods_spu')
  .doc('spu_001')
  .remove()
```

#### 7.4 云存储（Cloud Storage）

**什么是云存储？**
- 存储图片、视频、文件
- CDN 加速
- 临时访问链接
- 与云数据库无缝集成

**上传文件：**
```javascript
// 前端上传
wx.cloud.uploadFile({
  cloudPath: 'images/goods/001.png',  // 云端路径
  filePath: tempFilePath,              // 本地临时路径
  success: res => {
    console.log(res.fileID)  // 返回文件 ID
  }
})

// 云函数上传
const result = await cloud.uploadFile({
  cloudPath: 'images/goods/001.png',
  fileContent: buffer
})
```

**获取文件：**
```javascript
// 获取临时链接
const res = await cloud.getTempFileURL({
  fileList: ['cloud://xxx/images/goods/001.png']
})
console.log(res.fileList[0].tempFileURL)
```

#### 7.5 官方推荐理由

1. **免运维**：无需管理服务器、数据库、存储
2. **低成本**：免费额度足够开发测试
3. **高性能**：全球 CDN 加速
4. **安全可靠**：微信安全团队维护
5. **深度集成**：与小程序、公众号无缝对接
6. **快速开发**：专注业务逻辑，无需关注基础设施

**免费额度（每月）：**
- 云函数：40 万次调用
- 数据库：5 万次读操作
- 云存储：5GB 存储空间
- CDN 流量：5GB

---

### 第 8 章：客户端简单功能实现

#### 8.1 TDesign 组件库引入

**安装 TDesign：**
```bash
cd miniprogram
npm install tdesign-miniprogram
```

**引入组件（app.json）：**
```json
{
  "usingComponents": {
    "t-button": "tdesign-miniprogram/button/button",
    "t-input": "tdesign-miniprogram/input/input",
    "t-cell": "tdesign-miniprogram/cell/cell",
    "t-image": "tdesign-miniprogram/image/image",
    "t-tabs": "tdesign-miniprogram/tabs/tabs"
  }
}
```

**使用示例：**
```xml
<!-- 首页 WXML -->
<view class="container">
  <!-- Banner 轮播 -->
  <swiper class="banner" autoplay circular>
    <swiper-item wx:for="{{banners}}" wx:key="id">
      <t-image src="{{item.image}}" mode="aspectFill" />
    </swiper-item>
  </swiper>
  
  <!-- 分类 Tab -->
  <t-tabs value="{{activeTab}}" bindchange="onTabChange">
    <t-tab-panel wx:for="{{categories}}" 
                  wx:key="id" 
                  value="{{item.id}}" 
                  label="{{item.name}}" />
  </t-tabs>
  
  <!-- 商品列表 -->
  <view class="goods-grid">
    <view class="goods-item" wx:for="{{goodsList}}" wx:key="spuId"
          bindtap="goDetail" data-id="{{item.spuId}}">
      <t-image src="{{item.primaryImage}}" mode="aspectFill" />
      <view class="goods-info">
        <text class="title">{{item.title}}</text>
        <text class="price">¥{{item.minSalePrice}}</text>
      </view>
    </view>
  </view>
</view>
```

#### 8.2 首页实现

**home.js 完整代码：**
```javascript
const { fetchHomeConfig } = require('../../services/home/home')
const { fetchGoodsList } = require('../../services/good/fetchGoodsList')

Page({
  data: {
    banners: [],
    categories: [],
    activeTab: '',
    goodsList: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadHomeConfig()
    this.loadGoods()
  },

  async loadHomeConfig() {
    const config = await fetchHomeConfig()
    this.setData({
      banners: config.swiper || [],
      categories: config.tabList || [],
      activeTab: config.tabList?.[0]?.id || ''
    })
  },

  async loadGoods() {
    if (this.data.loading || !this.data.hasMore) return
    
    this.setData({ loading: true })
    const goods = await fetchGoodsList({
      category: this.data.activeTab,
      page: this.data.page
    })
    
    this.setData({
      goodsList: [...this.data.goodsList, ...goods],
      page: this.data.page + 1,
      hasMore: goods.length >= 20,
      loading: false
    })
  },

  onTabChange(e) {
    this.setData({
      activeTab: e.detail.value,
      goodsList: [],
      page: 1,
      hasMore: true
    })
    this.loadGoods()
  },

  goDetail(e) {
    const spuId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/goods/details/details?spuId=${spuId}`
    })
  },

  onReachBottom() {
    this.loadGoods()
  }
})
```

#### 8.3 分类页实现

**category.wxml：**
```xml
<view class="category-page">
  <!-- 一级分类（侧边栏） -->
  <scroll-view class="sidebar" scroll-y>
    <view class="category1-item {{activeCategory1 === item.id ? 'active' : ''}}"
          wx:for="{{category1List}}" wx:key="id"
          bindtap="selectCategory1" data-id="{{item.id}}">
      {{item.name}}
    </view>
  </scroll-view>
  
  <!-- 二级分类 + 商品网格 -->
  <scroll-view class="content" scroll-y>
    <view class="category2-section" wx:for="{{category2List}}" wx:key="id">
      <view class="section-title">{{item.name}}</view>
      <view class="goods-grid">
        <view class="goods-item" wx:for="{{item.goods}}" wx:key="spuId"
              wx:for-item="goods" bindtap="goDetail" data-id="{{goods.spuId}}">
          <t-image src="{{goods.primaryImage}}" mode="aspectFill" />
          <text class="goods-name">{{goods.title}}</text>
          <text class="goods-price">¥{{goods.minSalePrice}}</text>
        </view>
      </view>
    </view>
  </scroll-view>
</view>
```

#### 8.4 商品详情页

**details.js 核心逻辑：**
```javascript
const { fetchGoodsDetail } = require('../../../services/good/fetchGood')
const { fetchGoodsComments } = require('../../../services/good/fetchGoodsDetailsComments')

Page({
  data: {
    spu: null,
    skuList: [],
    specList: [],
    selectedSku: null,
    comments: [],
    showSkuPopup: false
  },

  async onLoad(options) {
    const { spuId } = options
    await this.loadGoodsDetail(spuId)
    await this.loadComments(spuId)
  },

  async loadGoodsDetail(spuId) {
    const detail = await fetchGoodsDetail(spuId)
    this.setData({
      spu: detail.spu,
      skuList: detail.skuList,
      specList: detail.specList
    })
  },

  async loadComments(spuId) {
    const comments = await fetchGoodsComments(spuId, { limit: 5 })
    this.setData({ comments })
  },

  // 显示 SKU 选择弹窗
  showSkuSelector() {
    this.setData({ showSkuPopup: true })
  },

  // 选择规格
  selectSpec(e) {
    const { specId, valueId } = e.currentTarget.dataset
    // 根据选中的规格找到对应 SKU
    this.findSelectedSku()
  },

  // 加入购物车
  async addToCart() {
    if (!this.data.selectedSku) {
      wx.showToast({ title: '请选择规格', icon: 'none' })
      return
    }
    
    await addToCart({
      spuId: this.data.spu.spuId,
      skuId: this.data.selectedSku.skuId,
      quantity: 1
    })
    
    wx.showToast({ title: '已加入购物车' })
    this.setData({ showSkuPopup: false })
  }
})
```

#### 8.5 实践：用 AI 生成首页

**使用 CodeBuddy：**
```
提示词：帮我实现一个校园咖啡小程序的首页，包含：
1. 顶部 Banner 轮播图
2. 分类 Tab 切换
3. 双列商品卡片展示
4. 使用 TDesign 组件
5. 样式参考 DESIGN_SYSTEM.md 中的设计规范
```

**AI 会生成：**
1. `pages/home/home.wxml` - 页面结构
2. `pages/home/home.wxss` - 页面样式
3. `pages/home/home.js` - 页面逻辑
4. `pages/home/home.json` - 页面配置

---

### 第 9 章：完整电商功能 Demo

#### 9.1 文档型数据库原理

**FlexDB vs 关系型数据库：**

| 特性 | FlexDB | MySQL |
|------|--------|-------|
| 数据格式 | JSON 文档 | 行和列 |
| Schema | 无固定 Schema | 固定 Schema |
| 查询语言 | 链式 API | SQL |
| 关联查询 | 嵌套文档 | JOIN |
| 扩展性 | 水平扩展 | 垂直扩展 |

**SPU/SKU/Spec 数据模型：**

```
goods_spu (商品)
    ├── goods_spec (规格维度：颜色、尺寸)
    └── goods_sku (具体规格组合：红色+XL)
```

**实际数据示例：**
```javascript
// goods_spu - 商品
{
  "_id": "spu_001",
  "spuId": "SPU001",
  "title": "美式咖啡",
  "primaryImage": "cloud://xxx/americano.png",
  "minSalePrice": 15.00,
  "isPutOnSale": true
}

// goods_spec - 规格维度
[
  { "specId": "spec_size", "title": "杯型", "values": ["中杯", "大杯"] },
  { "specId": "spec_temp", "title": "温度", "values": ["热", "冰"] }
]

// goods_sku - 具体规格
[
  { "skuId": "sku_001", "spuId": "SPU001", "specValues": ["中杯", "热"], "price": 15.00, "stock": 100 },
  { "skuId": "sku_002", "spuId": "SPU001", "specValues": ["中杯", "冰"], "price": 15.00, "stock": 100 },
  { "skuId": "sku_003", "spuId": "SPU001", "specValues": ["大杯", "热"], "price": 18.00, "stock": 80 }
]
```

#### 9.2 云存储使用

**图片上传流程：**

```javascript
// 1. 选择图片
wx.chooseImage({
  count: 1,
  sizeType: ['compressed'],
  sourceType: ['album', 'camera'],
  success: async (res) => {
    const tempFilePath = res.tempFilePaths[0]
    
    // 2. 上传到云存储
    const uploadRes = await wx.cloud.uploadFile({
      cloudPath: `images/goods/${Date.now()}.jpg`,
      filePath: tempFilePath
    })
    
    // 3. 获取文件 ID
    const fileID = uploadRes.fileID
    console.log('上传成功：', fileID)
    
    // 4. 保存到数据库
    await db.collection('goods_spu').add({
      data: {
        title: '新商品',
        primaryImage: fileID
      }
    })
  }
})
```

**图片展示：**
```xml
<!-- 直接使用 fileID -->
<image src="{{goods.primaryImage}}" mode="aspectFill" />

<!-- 或获取临时链接 -->
<image src="{{tempUrl}}" mode="aspectFill" />
```

```javascript
// 获取临时链接
const res = await wx.cloud.getTempFileURL({
  fileList: [goods.primaryImage]
})
const tempUrl = res.fileList[0].tempFileURL
```

#### 9.3 购物车实现

**购物车云函数（manageCart）：**
```javascript
// cloudfunctions/manageCart/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, payload } = event

  switch (action) {
    case 'add':
      return await addToCart(OPENID, payload)
    case 'update':
      return await updateQuantity(OPENID, payload)
    case 'remove':
      return await removeFromCart(OPENID, payload)
    case 'list':
      return await getCartList(OPENID)
    default:
      return { error: '未知操作' }
  }
}

async function addToCart(openid, { spuId, skuId, quantity }) {
  // 检查是否已在购物车
  const existing = await db.collection('cart')
    .where({ _openid: openid, skuId })
    .get()

  if (existing.data.length > 0) {
    // 更新数量
    await db.collection('cart')
      .doc(existing.data[0]._id)
      .update({
        data: { quantity: _.inc(quantity) }
      })
  } else {
    // 新增
    await db.collection('cart').add({
      data: {
        _openid: openid,
        spuId,
        skuId,
        quantity,
        isSelected: true,
        createdAt: db.serverDate()
      }
    })
  }

  return { success: true }
}
```

#### 9.4 订单创建（事务）

**createOrder 云函数核心逻辑：**
```javascript
async function createOrder(openid, orderData) {
  const { addressId, goodsList, deliveryType } = orderData

  // 使用事务保证原子性
  const transaction = await db.startTransaction()

  try {
    // 1. 校验商品和库存
    for (const item of goodsList) {
      const sku = await transaction.collection('goods_sku')
        .doc(item.skuId)
        .get()
      
      if (sku.data.stock < item.quantity) {
        throw new Error(`库存不足：${sku.data.specValues.join('/')}`)
      }
      
      // 2. 扣减库存
      await transaction.collection('goods_sku')
        .doc(item.skuId)
        .update({
          data: { stock: _.inc(-item.quantity) }
        })
    }

    // 3. 计算订单金额（服务端计算，不信任客户端）
    const totalAmount = await calculateOrderAmount(goodsList)

    // 4. 创建订单
    const order = await transaction.collection('order').add({
      data: {
        _openid: openid,
        orderNo: generateOrderNo(),
        status: 'PENDING_PAYMENT',
        goodsList,
        orderSummary: {
          totalAmount,
          goodsCount: goodsList.length
        },
        deliveryType,
        addressId,
        createdAt: db.serverDate()
      }
    })

    // 5. 清理购物车
    const skuIds = goodsList.map(g => g.skuId)
    await transaction.collection('cart')
      .where({
        _openid: openid,
        skuId: _.in(skuIds)
      })
      .remove()

    // 提交事务
    await transaction.commit()

    return { orderId: order._id, orderNo: order.orderNo }
  } catch (err) {
    // 回滚事务
    await transaction.rollback()
    throw err
  }
}
```

#### 9.5 订单状态流转

```
创建订单 → PENDING_PAYMENT (待支付)
    ↓ 支付成功
PENDING_DELIVERY (待发货)
    ↓ 管理员发货
PENDING_RECEIPT (待收货)
    ↓ 用户确认收货 / 超时自动
COMPLETE (已完成)

PENDING_PAYMENT → 用户取消 → CANCELED_NOT_PAYMENT
PENDING_PAYMENT → 超时取消 → PAYMENT_TIMEOUT
PENDING_DELIVERY → 管理员取消 → CANCELED_PAYMENT
```

**练习：**
1. 导入种子数据到云数据库
2. 实现商品详情页
3. 完成购物车功能
4. 跑通完整的下单流程

---

### 第 10 章：云函数深入

#### 10.1 云函数结构

**标准结构：**
```
cloudfunctions/
└── myFunction/
    ├── index.js        # 函数入口
    ├── config.json     # 函数配置
    └── package.json    # 依赖声明
```

**index.js 模板：**
```javascript
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV  // 自动使用当前环境
})

// 获取数据库引用
const db = cloud.database()

// 主函数
exports.main = async (event, context) => {
  // event: 前端传入的参数
  // context: 运行上下文
  
  const { OPENID, APPID } = cloud.getWXContext()
  
  // 业务逻辑...
  
  return {
    success: true,
    data: result
  }
}
```

**config.json 配置：**
```json
{
  "permissions": {
    "openapi": [
      "auth.getPhoneNumber",    // 获取手机号
      "wxacode.getUnlimited"    // 生成小程序码
    ]
  },
  "triggers": [
    {
      "name": "myTrigger",
      "type": "timer",
      "config": "0 0 2 * * * *"  // 每天凌晨 2 点
    }
  ]
}
```

#### 10.2 wx-server-sdk 常用 API

```javascript
const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// ===== 数据库操作 =====

// 查询
await db.collection('users').where({ age: _.gt(18) }).get()

// 新增
await db.collection('users').add({ data: { name: '张三', age: 20 } })

// 更新
await db.collection('users').doc('user-id').update({ data: { age: 21 } })

// 删除
await db.collection('users').doc('user-id').remove()

// 计数
await db.collection('users').where({ age: _.gt(18) }).count()

// ===== 聚合查询 =====

const $ = db.command.aggregate
await db.collection('orders').aggregate()
  .match({ status: 'COMPLETE' })
  .group({
    _id: '$userId',
    totalAmount: $.sum('$amount'),
    orderCount: $.sum(1)
  })
  .end()

// ===== 云存储 =====

// 上传
await cloud.uploadFile({
  cloudPath: 'images/test.png',
  fileContent: buffer
})

// 下载
const res = await cloud.downloadFile({ fileID: 'xxx' })

// 获取临时链接
await cloud.getTempFileURL({ fileList: ['file-id'] })

// ===== 调用其他云函数 =====

await cloud.callFunction({
  name: 'otherFunction',
  data: { key: 'value' }
})

// ===== 获取用户信息 =====

const { OPENID, APPID, UNIONID } = cloud.getWXContext()
```

#### 10.3 云函数调用云函数

```javascript
// cloudfunctions/createOrder/index.js
async function createOrder(event) {
  // 调用 login 函数获取用户信息
  const userRes = await cloud.callFunction({
    name: 'login'
  })
  
  // 调用支付函数
  const payRes = await cloud.callFunction({
    name: 'unifiedOrder',
    data: {
      orderNo: order.orderNo,
      amount: order.totalAmount
    }
  })
  
  return payRes.result
}
```

#### 10.4 定时触发器

**场景：超时未支付自动取消订单**

**配置（config.json）：**
```json
{
  "triggers": [
    {
      "name": "cancelOrderTimer",
      "type": "timer",
      "config": "0 */5 * * * * *"
    }
  ]
}
```

**实现（index.js）：**
```javascript
exports.main = async (event, context) => {
  // 查询超过 1 小时未支付的订单
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const orders = await db.collection('order')
    .where({
      status: 'PENDING_PAYMENT',
      createdAt: _.lt(oneHourAgo)
    })
    .get()

  for (const order of orders.data) {
    // 恢复库存
    await restoreStock(order.goodsList)
    
    // 更新订单状态
    await db.collection('order')
      .doc(order._id)
      .update({
        data: { status: 'PAYMENT_TIMEOUT' }
      })
  }

  return { cancelled: orders.data.length }
}
```

#### 10.5 实践：分析 createOrder

**关键点：**
1. **事务保证原子性**：扣库存 + 建单 + 清购物车要么全成功，要么全失败
2. **服务端计算金额**：不信任客户端传入的价格
3. **库存校验**：防止超卖
4. **错误处理**：事务回滚

**练习：**
1. 阅读 `cloudfunctions/createOrder/index.js` 完整代码
2. 理解事务的使用方式
3. 尝试修改为支持优惠券功能

---

## 第五部分：高级功能篇

### 第 11 章：微信支付流程

#### 11.1 支付流程概览

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  小程序   │    │  云函数   │    │ 微信支付  │    │  商户号   │
│  (前端)   │    │          │    │  (API)   │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1.创建订单     │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │ 2.统一下单     │               │               │
     │               │──────────────────────────────>│
     │               │               │               │
     │ 3.返回支付参数  │               │               │
     │<──────────────│               │               │
     │               │               │               │
     │ 4.调起支付     │               │               │
     │───────────────────────────────>│               │
     │               │               │               │
     │ 5.用户确认支付  │               │               │
     │               │               │               │
     │               │ 6.支付回调     │               │
     │               │<──────────────│               │
     │               │               │               │
     │ 7.更新订单状态  │               │               │
     │<──────────────│               │               │
```

#### 11.2 支付工作流配置

**在云开发控制台配置：**
1. 进入云开发控制台
2. 选择「工作流」
3. 创建支付工作流
4. 配置商户号、API 密钥

**tenant.config.js 配置：**
```javascript
module.exports = {
  // 支付工作流名称（从控制台获取）
  paymentWorkflow: 'your-payment-workflow-name',
  refundWorkflow: 'your-refund-workflow-name',
}
```

#### 11.3 统一下单（unifiedOrder）

```javascript
// cloudfunctions/unifiedOrder/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { orderNo } = event

  // 1. 查询订单
  const order = await db.collection('order')
    .where({ orderNo, _openid: OPENID })
    .get()

  if (order.data.length === 0) {
    throw new Error('订单不存在')
  }

  const orderData = order.data[0]
  
  // 2. 校验订单状态
  if (orderData.status !== 'PENDING_PAYMENT') {
    throw new Error('订单状态异常')
  }

  // 3. 调用支付工作流（金额单位：分）
  const payResult = await cloud.callFunction({
    name: 'cloudbase_module',
    data: {
      type: 'pay',
      workflowName: config.paymentWorkflow,
      data: {
        body: `校园咖啡-订单${orderNo}`,
        outTradeNo: orderNo,
        totalFee: Math.round(orderData.orderSummary.totalAmount * 100),
        openid: OPENID
      }
    }
  })

  return payResult
}
```

#### 11.4 支付回调（paymentCallback）

```javascript
// cloudfunctions/paymentCallback/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { outTradeNo, resultCode, transactionId, totalFee } = event

  // 1. 解密回调数据（AES-256-GCM）
  const decrypted = decryptCallback(event)

  // 2. 校验支付结果
  if (decrypted.resultCode !== 'SUCCESS') {
    console.error('支付失败：', decrypted)
    return { errcode: -1 }
  }

  // 3. 更新订单状态
  await db.collection('order')
    .where({ orderNo: decrypted.outTradeNo })
    .update({
      data: {
        status: 'PENDING_DELIVERY',
        wechatPayInfo: {
          transactionId: decrypted.transactionId,
          totalFee: decrypted.totalFee,
          paidAt: db.serverDate()
        }
      }
    })

  return { errcode: 0 }
}
```

#### 11.5 退款流程

```javascript
// 管理端发起退款
async function refundOrder(orderNo, refundAmount) {
  const order = await db.collection('order')
    .where({ orderNo })
    .get()

  // 校验退款金额不超过支付金额
  if (refundAmount > order.wechatPayInfo.totalFee) {
    throw new Error('退款金额超过支付金额')
  }

  // 调用退款工作流
  const result = await cloud.callFunction({
    name: 'cloudbase_module',
    data: {
      type: 'refund',
      workflowName: config.refundWorkflow,
      data: {
        outTradeNo: orderNo,
        outRefundNo: `REFUND_${orderNo}`,
        totalFee: order.wechatPayInfo.totalFee,
        refundFee: refundAmount
      }
    }
  })

  return result
}
```

#### 11.6 实践：1 分钱测试

**配置步骤：**
1. 确保已开通微信支付商户号
2. 在云开发控制台配置支付工作流
3. 修改 `payment.js` 中的测试金额为 1 分

**测试流程：**
1. 创建订单
2. 点击支付
3. 输入支付密码
4. 查看订单状态变为「待发货」

---

### 第 12 章：物流与其他能力

#### 12.1 物流助手 API

**开通物流助手：**
1. 登录微信商户平台
2. 开通「物流助手」功能
3. 配置物流公司

**查询物流轨迹：**
```javascript
// cloudfunctions/getLogisticsTrack/index.js
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { orderId } = event

  // 1. 查询订单获取物流信息
  const order = await db.collection('order')
    .where({ _id: orderId, _openid: OPENID })
    .get()

  if (!order.data[0].logistics) {
    return { tracks: [] }
  }

  const { deliveryId, trackingNo } = order.data[0].logistics

  // 2. 调用微信物流助手 API
  const result = await cloud.callFunction({
    name: 'cloudbase_module',
    data: {
      type: 'logistics',
      action: 'getPath',
      data: {
        delivery_id: deliveryId,
        waybill_id: trackingNo
      }
    }
  })

  return result
}
```

**物流轨迹展示：**
```xml
<view class="logistics-track">
  <view class="track-item" wx:for="{{tracks}}" wx:key="index">
    <view class="track-dot {{index === 0 ? 'active' : ''}}"></view>
    <view class="track-content">
      <text class="track-desc">{{item.desc}}</text>
      <text class="track-time">{{item.time}}</text>
    </view>
  </view>
</view>
```

#### 12.2 小程序码生成

```javascript
// cloudfunctions/generateQRCode/index.js
exports.main = async (event, context) => {
  const { scene, page } = event

  // 生成小程序码
  const result = await cloud.openapi.wxacode.getUnlimited({
    scene: scene || 'default',  // 参数
    page: page || 'pages/home/home',  // 页面路径
    width: 280
  })

  // 上传到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath: `qrcode/${scene}.jpg`,
    fileContent: result.buffer
  })

  return { fileID: uploadResult.fileID }
}
```

#### 12.3 手机号获取

**前端：**
```xml
<button open-type="getPhoneNumber" bindgetphonenumber="getPhoneNumber">
  获取手机号
</button>
```

```javascript
async getPhoneNumber(e) {
  if (e.detail.errMsg !== 'getPhoneNumber:ok') return
  
  const { code } = e.detail
  
  // 调用云函数获取手机号
  const res = await wx.cloud.callFunction({
    name: 'login',
    data: {
      action: 'getPhoneNumber',
      code
    }
  })
  
  console.log('手机号：', res.result.phoneNumber)
}
```

**云函数：**
```javascript
// cloudfunctions/login/index.js
async function getPhoneNumber(code) {
  const result = await cloud.openapi.phonenumber.getPhoneNumber({
    code
  })
  return result
}
```

#### 12.4 实践：查看物流详情

**操作步骤：**
1. 创建一个订单并支付
2. 在管理端发货，填写物流单号
3. 在用户端查看物流详情
4. 理解物流轨迹查询的完整流程

---

### 第 13 章：管理端方案

#### 13.1 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **微搭低代码** | 可视化搭建、快速上线 | 定制性差、学习成本 | 简单管理需求 |
| **云开发 CMS** | 官方维护、功能完整 | 样式固定、扩展性有限 | 内容管理 |
| **自建管理端** | 完全定制、与业务深度集成 | 开发成本高 | 复杂业务 |
| **小程序内嵌** | 无需额外部署、用户友好 | 功能相对简单 | 轻量管理 |

**本项目方案：小程序内嵌管理端**

优势：
- 无需额外域名和部署
- 复用小程序用户体系
- 管理员手机随时管理
- 与用户端数据实时同步

#### 13.2 权限控制

**权限模型：**
```javascript
// user_info 集合
{
  "_id": "user_001",
  "_openid": "openid_xxx",
  "nickName": "管理员",
  "role": "admin",  // 角色：user / admin
  "createdAt": "2024-01-01"
}
```

**前端权限判断：**
```javascript
// pages/usercenter/usercenter.js
Page({
  data: {
    isAdmin: false
  },

  onLoad() {
    this.checkAdminRole()
  },

  async checkAdminRole() {
    const app = getApp()
    const userInfo = await getUserInfo()
    
    this.setData({
      isAdmin: userInfo.role === 'admin'
    })
  }
})
```

```xml
<!-- 管理端入口（条件渲染） -->
<view class="admin-entry" wx:if="{{isAdmin}}" bindtap="goAdmin">
  <t-icon name="setting" />
  <text>商家工作台</text>
</view>
```

**后端权限校验：**
```javascript
// cloudfunctions/adminManageGoods/index.js
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 校验管理员权限
  const user = await db.collection('user_info')
    .where({ _openid: OPENID })
    .get()

  if (user.data[0]?.role !== 'admin') {
    throw new Error('无权限访问')
  }

  // 执行管理操作...
}
```

#### 13.3 管理端页面

**管理台入口（admin/dashboard）：**
```xml
<view class="dashboard">
  <view class="menu-grid">
    <view class="menu-item" bindtap="goPage" data-page="goods">
      <t-icon name="shop" size="48rpx" />
      <text>商品管理</text>
    </view>
    <view class="menu-item" bindtap="goPage" data-page="order">
      <t-icon name="order" size="48rpx" />
      <text>订单管理</text>
    </view>
    <view class="menu-item" bindtap="goPage" data-page="after-service">
      <t-icon name="service" size="48rpx" />
      <text>售后管理</text>
    </view>
    <view class="menu-item" bindtap="goPage" data-page="stock">
      <t-icon name="inventory" size="48rpx" />
      <text>库存管理</text>
    </view>
  </view>
</view>
```

**商品管理页面：**
```xml
<view class="goods-manage">
  <!-- 商品列表 -->
  <view class="goods-list">
    <view class="goods-item" wx:for="{{goodsList}}" wx:key="_id">
      <image src="{{item.primaryImage}}" mode="aspectFill" />
      <view class="goods-info">
        <text class="title">{{item.title}}</text>
        <text class="price">¥{{item.minSalePrice}}</text>
        <text class="stock">库存: {{item.totalStock}}</text>
      </view>
      <view class="actions">
        <t-button size="small" bindtap="editGoods" data-id="{{item._id}}">编辑</t-button>
        <t-button size="small" theme="danger" bindtap="toggleStatus" 
                  data-id="{{item._id}}" data-status="{{item.isPutOnSale}}">
          {{item.isPutOnSale ? '下架' : '上架'}}
        </t-button>
      </view>
    </view>
  </view>
  
  <!-- 添加商品按钮 -->
  <t-button class="add-btn" theme="primary" bindtap="addGoods">
    添加商品
  </t-button>
</view>
```

#### 13.4 实践：成为管理员

**操作步骤：**
1. 在小程序中登录一次（触发用户建档）
2. 打开云开发控制台 → 数据库 → user_info
3. 找到你的用户记录
4. 将 `role` 字段修改为 `admin`
5. 刷新小程序个人中心
6. 看到「商家工作台」入口

---

## 第六部分：运营与发布篇

### 第 14 章：云开发高级功能

#### 14.1 账户体系与登录

**登录流程：**
```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  小程序   │    │  云函数   │    │  数据库   │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     │ wx.login()    │               │
     │──────────────>│               │
     │               │               │
     │ 获取 openid   │               │
     │               │──────────────>│
     │               │               │
     │               │ 查询用户      │
     │               │──────────────>│
     │               │               │
     │               │ 用户存在?     │
     │               │<──────────────│
     │               │               │
     │ 返回用户信息   │               │
     │<──────────────│               │
```

**login 云函数：**
```javascript
// cloudfunctions/login/index.js
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  // 查询用户
  let user = await db.collection('user_info')
    .where({ _openid: OPENID })
    .get()

  if (user.data.length === 0) {
    // 新用户，创建记录
    const newUser = {
      _openid: OPENID,
      nickName: '微信用户',
      avatarUrl: '',
      role: 'user',
      createdAt: db.serverDate()
    }
    
    await db.collection('user_info').add({ data: newUser })
    user = { data: [newUser] }
  }

  return {
    userInfo: user.data[0],
    openid: OPENID
  }
}
```

#### 14.2 安全规则配置

**数据库权限设置：**

| 集合 | 读权限 | 写权限 |
|------|--------|--------|
| goods_spu | 所有人 | 仅管理员（云函数） |
| goods_sku | 所有人 | 仅管理员（云函数） |
| cart | 仅创建者 | 仅创建者（云函数） |
| order | 仅创建者 | 仅创建者（云函数） |
| address | 仅创建者 | 仅创建者（云函数） |
| user_info | 仅创建者 | 仅创建者（云函数） |

**在云开发控制台配置：**
1. 进入数据库 → 选择集合
2. 权限设置 → 自定义安全规则
3. 配置读写权限

**安全规则示例：**
```json
{
  "read": "auth.openid == doc._openid",
  "write": false
}
```

#### 14.3 数据权限设计

**用户只能读自己的数据：**
```javascript
// services/order/orderList.js
const fetchOrderList = async (status) => {
  const app = getApp()
  const openid = app.globalData.openid
  
  const res = await app.cloudModels.order.list({
    filter: {
      where: {
        _openid: openid,  // 只查自己的订单
        status: status || { $ne: null }
      }
    }
  })
  
  return res.data.records
}
```

**管理员可以读所有数据：**
```javascript
// cloudfunctions/adminManageOrder/index.js
exports.main = async (event, context) => {
  // 已校验 admin 权限
  
  // 可以查所有订单
  const orders = await db.collection('order')
    .where({ status: 'PENDING_DELIVERY' })
    .get()
  
  return orders.data
}
```

#### 14.4 云函数日志与监控

**日志记录：**
```javascript
exports.main = async (event, context) => {
  console.log('请求参数：', event)
  console.log('用户 OPENID：', context.OPENID)
  
  try {
    // 业务逻辑
    const result = await doSomething()
    console.log('执行成功：', result)
    return result
  } catch (err) {
    console.error('执行失败：', err)
    throw err
  }
}
```

**在云开发控制台查看日志：**
1. 进入云开发控制台
2. 选择「云函数」
3. 点击函数名 → 「日志」
4. 查看调用日志和错误日志

**监控告警：**
1. 进入云开发控制台 → 「监控」
2. 查看调用量、错误率、耗时
3. 配置告警规则（错误率 > 5%）

#### 14.5 实践：配置数据权限

**操作步骤：**
1. 打开云开发控制台 → 数据库
2. 选择 `order` 集合
3. 设置权限为「仅创建者可读写」
4. 测试：用不同账号登录，验证只能看到自己的订单

---

### 第 15 章：发布与上架

#### 15.1 审核要点

**常见审核失败原因：**

| 问题 | 说明 | 解决方案 |
|------|------|---------|
| 类目不符 | 服务类目与功能不匹配 | 选择正确的服务类目 |
| 隐私协议 | 未配置用户隐私保护指引 | 在后台配置隐私协议 |
| 内容违规 | 商品描述含敏感词 | 检查并修改文案 |
| 功能不完整 | 部分功能无法使用 | 确保所有功能可正常使用 |
| 支付问题 | 支付功能异常 | 测试完整支付流程 |

**审核前检查清单：**
- [ ] 所有页面可正常访问
- [ ] 支付功能正常（测试 1 分钱）
- [ ] 隐私协议已配置
- [ ] 服务类目正确
- [ ] 商品信息完整
- [ ] 无敏感内容

#### 15.2 隐私协议配置

**配置步骤：**
1. 登录 mp.weixin.qq.com
2. 左侧菜单 → 设置 → 基本设置
3. 服务内容声明 → 用户隐私保护指引
4. 填写收集的用户信息及用途

**需要声明的信息：**
- 用户信息（昵称、头像）
- 收货地址
- 手机号
- 位置信息（如需要）

#### 15.3 版本管理

**版本类型：**

| 类型 | 说明 | 用途 |
|------|------|------|
| 开发版 | 开发者可预览 | 开发调试 |
| 体验版 | 体验者可访问 | 内部测试 |
| 审核版 | 提交审核中 | 审核 |
| 正式版 | 所有用户可用 | 线上运营 |

**发布流程：**
```
开发 → 上传代码 → 设置体验版 → 提交审核 → 审核通过 → 发布
```

**操作步骤：**
1. **上传代码**：微信开发者工具 → 点击「上传」
2. **设置体验版**：mp.weixin.qq.com → 管理 → 版本管理 → 设为体验版
3. **提交审核**：版本管理 → 提交审核
4. **审核通过**：审核 → 审核通过 → 全量发布

#### 15.4 云函数部署

**手动部署：**
```bash
# 部署单个云函数
cd cloudfunctions/login
npm install
# 右键云函数目录 → 上传并部署

# 或使用 CLI
tcb fn deploy login
```

**批量部署脚本：**
```bash
#!/bin/bash
# uploadCloudFunction.sh

# 遍历所有云函数目录
for dir in cloudfunctions/*/; do
  func_name=$(basename "$dir")
  echo "部署云函数: $func_name"
  
  cd "$dir"
  npm install --production
  cd ../..
  
  # 使用 tcb CLI 部署
  tcb fn deploy "$func_name"
done

echo "全部云函数部署完成"
```

**使用方式：**
```bash
chmod +x uploadCloudFunction.sh
./uploadCloudFunction.sh
```

#### 15.5 持续集成（GitHub Actions）

**.github/workflows/deploy.yml：**
```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run check

  deploy:
    needs: lint
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup TCB CLI
        run: npm install -g @cloudbase/cli
      
      - name: Login
        run: tcb login --apiKey ${{ secrets.TCB_API_KEY }}
      
      - name: Deploy Cloud Functions
        run: |
          for dir in cloudfunctions/*/; do
            func=$(basename "$dir")
            tcb fn deploy "$func" --envId ${{ secrets.ENV_ID }}
          done
      
      - name: Deploy Static Assets
        run: tcb hosting deploy miniprogram/ --envId ${{ secrets.ENV_ID }}
```

#### 15.6 实践：发布体验版

**操作步骤：**
1. 确保所有功能测试通过
2. 在微信开发者工具点击「上传」
3. 填写版本号（如 `1.0.0`）和备注
4. 登录 mp.weixin.qq.com
5. 进入「管理」→「版本管理」
6. 找到刚上传的版本，点击「设为体验版」
7. 添加体验者微信号
8. 手机扫码体验

---

## 附录

### 附录 A：常见问题

**Q1：云开发环境 ID 在哪里找？**
A：微信开发者工具 → 云开发 → 设置 → 环境 ID

**Q2：如何切换云开发环境？**
A：修改 `tenants/*/tenant.config.js` 中的 `envId`，然后执行 `npm run sync:tenant`

**Q3：支付功能需要什么条件？**
A：需要企业或个体工商户的 AppID，并开通微信支付商户号

**Q4：如何调试云函数？**
A：微信开发者工具 → 云开发 → 云函数 → 选择函数 → 测试

**Q5：如何查看数据库数据？**
A：微信开发者工具 → 云开发 → 数据库 → 选择集合

### 附录 B：资源链接

- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [TDesign 组件库](https://tdesign.tencent.com/miniprogram/)
- [mini-ecom-open GitHub](https://github.com/your-username/mini-ecom-open)
- [CodeBuddy 使用指南](https://developers.weixin.qq.com/miniprogram/dev/devtools/codebuddy.html)

### 附录 C：课程配套资源

1. **代码仓库**：mini-ecom-open 教学分支
2. **种子数据**：`cloudbase/bootstrap/coffee/`（校园咖啡主题）
3. **AI 规则包**：预配置的 `.codebuddy/rules/` 目录
4. **设计系统**：`docs/DESIGN_SYSTEM.md`
5. **数据模型**：`docs/DATA_MODELS.md`

---

## 课程总结

通过本课程，你将掌握：

1. **小程序基础**：理解双线程模型、生命周期、组件化开发
2. **云开发能力**：云函数、云数据库、云存储的使用
3. **AI 辅助开发**：MCP、Skills、OpenSpec 工作流
4. **完整电商链路**：商品、购物车、订单、支付、售后
5. **工程化实践**：多租户、权限控制、CI/CD
6. **发布运营**：审核、版本管理、监控

**最终产出**：一个可上线发布的"校园咖啡"小程序电商

---

*课程版本：v1.0*  
*最后更新：2024 年*  
*基于 mini-ecom-open 工程*
