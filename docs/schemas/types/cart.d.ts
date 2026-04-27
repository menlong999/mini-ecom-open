
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalCart {
/**
 * quantity
 * 
 */
quantity?: number
/**
 * thumb
 * 
 */
thumb?: string
/**
 * stockQuantity
 * 
 */
stockQuantity?: number
/**
 * title
 * 
 */
title?: string
/**
 * userId
 * 
 */
userId?: string
/**
 * valid
 * 
 */
valid?: boolean
/**
 * price
 * 
 */
price?: number
/**
 * isSelected
 * 
 */
isSelected?: boolean
/**
 * specInfo
 * 
 */
specInfo?: {
/**
 * specId
 * 
 */
specId?: string
/**
 * specValue
 * 
 */
specValue?: string
/**
 * specValueId
 * 
 */
specValueId?: string
/**
 * specTitle
 * 
 */
specTitle?: string
}[]
/**
 * spuId
 * 
 */
spuId?: string
/**
 * _id
 * 
 */
_id?: string
/**
 * skuId
 * 
 */
skuId?: string
}


interface IModels {

    /**
    * 数据模型：cart
    */ 
    cart: DataModelMethods<IModalCart>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}