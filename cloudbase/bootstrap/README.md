# CloudBase 示例种子数据

本目录提供的是“新 tenant 初始化时可参考的示例数据”，不是生产环境最终数据。

可直接参考的文件：

- `home_config.example.json`
- `store.example.json`

建议流程：

1. 在新 CloudBase 环境创建对应集合
2. 用示例数据导入 `home_config` 和 `store`
3. 根据租户品牌、门店、商品、链接关系再调整内容

说明：

- `home_config` 和 `store` 属于运营数据，保留在数据库，不进入 tenant 本地配置
- 商品、分类、SKU、管理员用户等数据，需要按你的业务单独初始化
