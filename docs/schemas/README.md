# CloudBase 数据模型 Schema 快照

本目录保存了 CloudBase FlexDB 中所有 **公共数据模型** 的 schema 快照，
作为开源版本的"事实数据契约"。

## 目录说明

```
docs/schemas/
├── json/    # 由 CloudBase 控制台导出的 JSON Schema（含字段类型、索引、关系等元数据）
├── types/   # 由 cloudbase CLI 拉取的 TypeScript 类型定义（IModalXxx）
└── README.md
```

| 模型            | 含义     | 主要业务用途                      |
| :-------------- | :------- | :-------------------------------- |
| `goods_spu`     | 商品 SPU | 商品标题/主图/分类/上架状态       |
| `goods_sku`     | 商品 SKU | 规格组合、单价、库存              |
| `goods_spec`    | 规格定义 | 颜色 / 尺寸 等维度                |
| `category1`     | 一级分类 | 顶层分类                          |
| `category2`     | 二级分类 | 二级分类，挂载到 SPU              |
| `cart`          | 购物车   | 用户购物车条目                    |
| `address`       | 收货地址 | 用户地址簿                        |
| `user_info`     | 用户资料 | openid、昵称、头像                |
| `comments`      | 商品评论 | 评分、晒图、回复                  |
| `order`         | 订单     | 主流程数据，含支付/物流/发票/自提 |
| `after-service` | 售后单   | 退货/退款                         |
| `home_config`   | 首页配置 | Banner、楼层、入口                |
| `store`         | 门店     | 自提门店信息                      |

> **备注**：`sys_user`、`sys_department`、`sys_user_dau`、`wxpay_atmf1no` 是
> CloudBase 平台 / 微信支付内置模型，开源版本不依赖、也不需要导出。

## 如何刷新 Schema 快照

使用 **CloudBase CLI ≥ 3.0**（本仓库验证版本：`3.2.2`）。

### 1. 安装并登录

```bash
npm i -g @cloudbase/cli      # 安装
tcb -v                        # 校验版本，应 ≥ 3.0.0
tcb login                     # 浏览器扫码登录
```

### 2. 列出环境内的所有模型

```bash
tcb db model list -e <你的环境ID>
# 也可以拿 JSON：
tcb db model list -e <你的环境ID> --json
```

### 3. 拉取单个模型的 schema

CLI 默认把 `cloud-models.d.ts` + `database-schemas/*.json` **写到执行
命令的当前目录**，并强制创建/覆盖 `cloudbaserc.json`、`tsconfig.json`。
为了避免污染本仓库，请始终在一个 **临时空目录** 中执行 pull：

```bash
TMP=$(mktemp -d)
cd "$TMP"
for m in order goods_spu goods_sku goods_spec category1 category2 \
         cart address user_info comments after-service home_config store; do
  rm -f cloud-models.d.ts
  tcb db model pull -e <你的环境ID> -n "$m"
  mv cloud-models.d.ts "$m.d.ts"
done
```

### 4. 同步到本仓库

```bash
REPO=/path/to/mini-ecom-open
cp "$TMP"/*.d.ts                    "$REPO/docs/schemas/types/"
cp "$TMP"/database-schemas/*.json   "$REPO/docs/schemas/json/"
```

提交前 `git diff` 查看字段变化，确认是新业务需要而不是私有租户字段被
误同步进来。

## 已知问题

- `tcb db model pull` 的 `-d <dir>` 参数在路径含子目录时会被忽略，文件
  仍然写到 cwd，因此必须在临时目录中执行。
- `-n` 同时传多个模型名（逗号分隔）时，CLI 实际只会拉取第一个；建议
  按上面的脚本逐个 pull 后合并。
- `cloudbaserc.json` 与 `tsconfig.json` 会被自动生成，请勿把它们 commit
  到本仓库。
