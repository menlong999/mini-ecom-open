
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalCategory2 {
/**
 * thumbnail
 * 图片
 */
thumbnail?: string
data_spu_catL2_id_list?: ARRAY_TYPE_IModalGoodsSpu
/**
 * category2Id
 * 二级分类 ID
 */
category2Id?: string
category1Id?: IModalCategory1
category2Id_goods_list?: ARRAY_TYPE_IModalGoods
/**
 * category2Name
 * 二级分类名称
 */
category2Name: string
}
/**
 * category1Id
 * 
 */
interface IModalCategory1 {
/**
 * 数据标识
 * undefined
 */
_id?: string
}


interface IModels {

    /**
    * 数据模型：category2
    */ 
    category2: DataModelMethods<IModalCategory2>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}