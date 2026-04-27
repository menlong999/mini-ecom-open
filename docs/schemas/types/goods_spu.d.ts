
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalGoodsSpu {
/**
 * spuStockQuantity
 * spu 总库存，可以从 sku 计算
 */
spuStockQuantity?: number
/**
 * images
 * 详情上方图列表
 */
images: string[]
/**
 * primaryImage
 * 列表主图
 */
primaryImage: string
/**
 * soldNum
 * spu 总销售量
 */
soldNum?: number
/**
 * isPutOnSale
 * 是否上架
 */
isPutOnSale?: boolean
/**
 * minSalePrice
 * 最低售价，可从 sku 计算得出
 */
minSalePrice?: number
/**
 * title
 * 商品标题
 */
title: string
/**
 * tags
 * 列表页展示标签
 */
tags?: string[]
/**
 * maxLinePrice
 * 最大划线价，主要在列表页展示
 */
maxLinePrice?: number
/**
 * spuId
 * 
 */
spuId?: string
goods_sku_spu_id_list?: ARRAY_TYPE_IModalGoodsSku
categoryId?: IModalCategory2
goods_spec_spu_id_list?: ARRAY_TYPE_IModalGoodsSpec
/**
 * desc
 * 详情页描述图
 */
desc?: string[]
}
/**
 * categoryId
 * 分类
 */
interface IModalCategory2 {
/**
 * 数据标识
 * undefined
 */
_id?: string
}


interface IModels {

    /**
    * 数据模型：goods_spu
    */ 
    goods_spu: DataModelMethods<IModalGoodsSpu>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}