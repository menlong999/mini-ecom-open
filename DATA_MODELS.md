# 极简电商 - 数据模型详细说明

本文档详细列出了电商小程序核心数据模型的字段及其含义。所有模型均部署在 CloudBase FlexDB 中。

## 1. 商品模块 (Goods)

### 1.1 商品 SPU (`goods_spu`)

标准产品单元（Standard Product Unit），定义商品的基础信息。

| 字段名             | 类型     | 描述                 | 必填 |
| :----------------- | :------- | :------------------- | :--- |
| `spuId`            | String   | SPU 唯一标识         | 是   |
| `title`            | String   | 商品标题             | 是   |
| `primaryImage`     | Image    | 列表展示主图         | 是   |
| `images`           | Array    | 详情页轮播图列表     | 是   |
| `desc`             | Array    | 商品详情图/文字描述  | 否   |
| `minSalePrice`     | Number   | 最低售价（单位：分） | 否   |
| `spuStockQuantity` | Number   | 总库存量             | 否   |
| `isPutOnSale`      | Boolean  | 是否上架             | 否   |
| `categoryId`       | Relation | 所属二级分类 ID      | 否   |

### 1.2 商品 SKU (`goods_sku`)

库存量单位（Stock Keeping Unit），定义具体的规格组合。

| 字段名       | 类型    | 描述                          | 必填 |
| :----------- | :------ | :---------------------------- | :--- |
| `skuId`      | String  | SKU 唯一标识                  | 是   |
| `spuId`      | String  | 关联的 SPU ID                 | 是   |
| `specValues` | Array   | 规格值组合（规格 ID + 值 ID） | 是   |
| `price`      | Number  | 售价（单位：分）              | 是   |
| `stock`      | Number  | 当前库存量                    | 是   |
| `image`      | Image   | 该规格对应的展示图            | 否   |
| `isDefault`  | Boolean | 是否为默认选中的规格          | 否   |

### 1.3 规格定义 (`goods_spec`)

商品规格维度定义（如：颜色、尺寸）。

| 字段名      | 类型   | 描述                         | 必填 |
| :---------- | :----- | :--------------------------- | :--- |
| `specId`    | String | 规格 ID                      | 是   |
| `title`     | String | 规格名称                     | 是   |
| `values`    | Array  | 规格值列表（valueId, value） | 是   |
| `sortOrder` | Number | 展示顺序                     | 否   |

## 2. 交易模块 (Transaction)

### 2.1 订单 (`order`)

| 字段名         | 类型     | 描述                                         | 必填 |
| :------------- | :------- | :------------------------------------------- | :--- |
| `orderNo`      | String   | 订单编号                                     | 是   |
| `userId`       | String   | 用户唯一标识                                 | 是   |
| `status`       | String   | 订单状态（待支付、待发货、已取消等）         | 是   |
| `goodsList`    | Array    | 商品快照列表（包含标题、单价、数量、规格等） | 是   |
| `orderSummary` | Object   | 订单金额汇总（总价、运费、应付金额等）       | 是   |
| `userAddress`  | Object   | 收货地址快照                                 | 否   |
| `deliveryType` | Number   | 配送方式（1: 快递, 2: 自提）                 | 是   |
| `pickupStore`  | Object   | 自提门店信息（自提模式下必填）               | 否   |
| `isCommented`  | Boolean  | 是否已评价                                   | 否   |
| `payTime`      | DateTime | 支付时间                                     | 否   |

### 2.2 购物车 (`cart`)

| 字段名       | 类型    | 描述               | 必填 |
| :----------- | :------ | :----------------- | :--- |
| `userId`     | String  | 用户唯一标识       | 是   |
| `spuId`      | String  | 关联的 SPU ID      | 是   |
| `skuId`      | String  | 关联的 SKU ID      | 是   |
| `quantity`   | Number  | 购买数量           | 是   |
| `isSelected` | Boolean | 是否选中（结算用） | 否   |
| `valid`      | Boolean | 商品是否有效       | 否   |

## 3. 用户与服务 (User & Service)

### 3.1 用户信息 (`user_info`)

| 字段名        | 类型   | 描述                       | 必填 |
| :------------ | :----- | :------------------------- | :--- |
| `nickName`    | String | 用户昵称                   | 否   |
| `avatarUrl`   | String | 用户头像                   | 否   |
| `phoneNumber` | String | 绑定手机号                 | 否   |
| `gender`      | Number | 性别（1:男, 2:女, 3:保密） | 否   |

### 3.2 收货地址 (`address`)

| 字段名          | 类型    | 描述             | 必填 |
| :-------------- | :------ | :--------------- | :--- |
| `name`          | String  | 收货人姓名       | 是   |
| `phone`         | String  | 联系电话         | 是   |
| `fullAddress`   | String  | 完整省市区信息   | 是   |
| `detailAddress` | String  | 详细街道/门牌号  | 是   |
| `isDefault`     | Boolean | 是否设为默认地址 | 否   |

### 3.3 售后 (`after-service`)

| 字段名     | 类型   | 描述                               | 必填 |
| :--------- | :----- | :--------------------------------- | :--- |
| `rightsNo` | String | 售后单号                           | 是   |
| `orderId`  | String | 关联订单 ID                        | 是   |
| `status`   | Number | 售后状态（处理中、已完成、已拒绝） | 是   |
| `amount`   | Number | 退款金额                           | 是   |
| `reason`   | String | 申请原因描述                       | 否   |
| `images`   | Array  | 凭证图片列表                       | 否   |

## 4. 运营配置 (Operations)

以下集合仍保留在各 tenant 自己的 CloudBase 环境中，属于运营数据，不进入本地 tenant 配置文件。

### 4.1 首页装修 (`home_config`)

| 字段名              | 类型   | 描述                                | 必填 |
| :------------------ | :----- | :---------------------------------- | :--- |
| `searchPlaceholder` | String | 首页搜索框占位文案                  | 否   |
| `swiper`            | Array  | 轮播区配置                          | 否   |
| `swiper[].image`    | String | 轮播图地址                          | 是   |
| `swiper[].spuId`    | String | 关联商品 ID                         | 否   |
| `swiper[].linkType` | String | 跳转类型，当前支持 `spu` / `poi`    | 否   |
| `swiper[].poi`      | Object | 线下地址信息，`linkType=poi` 时使用 | 否   |
| `tabList`           | Array  | 首页商品分组                        | 否   |
| `tabList[].text`    | String | 分组标题                            | 是   |
| `tabList[].spuIds`  | Array  | 分组内展示的商品 ID 列表            | 是   |
| `createdAt`         | Number | 创建时间戳                          | 否   |
| `updatedAt`         | Number | 更新时间戳                          | 否   |

### 4.2 自提门店 (`store`)

| 字段名          | 类型   | 描述                   | 必填 |
| :-------------- | :----- | :--------------------- | :--- |
| `name`          | String | 门店名称               | 是   |
| `address`       | String | 门店地址               | 是   |
| `phone`         | String | 联系电话               | 否   |
| `businessHours` | String | 营业时间               | 否   |
| `status`        | Number | 门店状态，`1` 表示启用 | 是   |
| `geoLoc`        | Object | 地理位置信息，可选     | 否   |
| `createdAt`     | Number | 创建时间戳             | 否   |
| `updatedAt`     | Number | 更新时间戳             | 否   |
