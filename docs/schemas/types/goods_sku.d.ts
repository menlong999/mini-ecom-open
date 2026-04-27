
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalGoodsSku {
/**
 * image
 * sku 图
 */
image?: string
/**
 * specValues
 * spec 组合
 */
specValues: {
/**
 * specId
 * 
 */
specId?: string
/**
 * specValueId
 * 
 */
specValueId?: string
}[]
/**
 * soldQuantity
 * 已售数量
 */
soldQuantity?: number
/**
 * isDefault
 * 是否在列表中默认展示
 */
isDefault?: boolean
/**
 * price
 * sku 售价
 */
price: number
spuId?: IModalGoodsSpu
/**
 * stock
 * 
 */
stock: number
/**
 * skuId
 * 
 */
skuId?: string
}
/**
 * spuId
 * 
 */
interface IModalGoodsSpu {
/**
 * 数据标识
 * undefined
 */
_id?: string
}


interface IModels {

    /**
    * 数据模型：goods_sku
    */ 
    goods_sku: DataModelMethods<IModalGoodsSku>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}