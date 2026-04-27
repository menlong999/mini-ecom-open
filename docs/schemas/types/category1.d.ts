
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalCategory1 {
/**
 * thumbnail
 * 图片
 */
thumbnail?: string
/**
 * category1Name
 * 一级分类名称
 */
category1Name: string
/**
 * category1Id
 * 
 */
category1Id?: string
category2Id_list?: ARRAY_TYPE_IModalCategory2
categoryL1Id_goods_list?: ARRAY_TYPE_IModalGoods
}


interface IModels {

    /**
    * 数据模型：category1
    */ 
    category1: DataModelMethods<IModalCategory1>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}