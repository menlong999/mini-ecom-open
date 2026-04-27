# CloudBase 示例种子数据

本目录提供的是“新 tenant 初始化时可参考的示例数据”，不是生产环境最终数据。

这里分两类文件：

- `*.example.json`：字段模板 / 占位示例，需要你替换品牌、图片、商品链接后再导入
- `*.mock.json`：可以直接用于新环境演示的默认数据，重点用于跑通首页、分类、详情、评论、门店自提等前台链路

可直接参考的文件：

- `home_config.example.json`
- `store.example.json`

可直接导入的默认演示数据：

- `category1.mock.json`
- `category2.mock.json`
- `goods_spu.mock.json`
- `goods_spec.mock.json`
- `goods_sku.mock.json`
- `comments.mock.json`
- `home_config.mock.json`
- `store.mock.json`

建议流程：

1. 在新 CloudBase 环境创建对应集合
2. 按顺序导入演示数据：`category1` -> `category2` -> `goods_spu` -> `goods_spec` -> `goods_sku` -> `comments` -> `home_config` -> `store`
3. 在微信开发者工具中打开 `miniprogram/`，即可直接浏览首页、分类、详情、评价与门店场景
4. 再根据租户品牌、门店、商品、链接关系调整为真实业务数据

说明：

- `home_config` 和 `store` 属于运营数据，保留在数据库，不进入 tenant 本地配置
- 这套 `mock` 数据的关系字段使用固定 `_id`，便于直接导入后跑通前端
- `mock` 数据里的图片默认引用 `miniprogram/assets/mock/` 下的本地资源，方便你立刻截图；如果你的 FlexDB / Data Model 控制台要求图片字段必须是 `cloud://` 文件 ID，可将同名文件上传到 CloudBase 存储后统一替换路径
- 商品、分类、SKU、管理员用户等数据，在真实商用前仍需要按你的业务单独初始化
