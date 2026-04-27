
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalGoodsSpec {
/**
 * specId
 * Spec ID
 */
specId?: string
/**
 * values
 * spec 值列表
 */
values: {
/**
 * valueId
 * 
 */
valueId?: string
/**
 * value
 * 
 */
value?: string
}[]
/**
 * title
 * spec 名称
 */
title: string
/**
 * sortOrder
 * 展示顺序，按从小到大
 */
sortOrder?: number
spuId?: IModalGoodsSpu
}
/**
 * spuId
 * 关联的 spu
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
    * 数据模型：goods_spec
    */ 
    goods_spec: DataModelMethods<IModalGoodsSpec>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}