
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalHomeConfig {
/**
 * searchPlaceholder
 * 
 */
searchPlaceholder?: string
/**
 * tabList
 * 
 */
tabList?: {
/**
 * text
 * 
 */
text?: string
/**
 * spuIds
 * 
 */
spuIds?: string[]
/**
 * key
 * 
 */
key?: string
}[]
/**
 * swiper
 * 
 */
swiper?: {
/**
 * image
 * 
 */
image?: string
/**
 * imageUrl
 * 
 */
imageUrl?: string
/**
 * spuId
 * 
 */
spuId?: string
/**
 * linkType
 * spu: 商品详情，poi：地址
 */
linkType?: string
/**
 * poi
 * 
 */
poi?: {
/**
 * address
 * 
 */
address?: string
/**
 * latitude
 * 
 */
latitude?: number
/**
 * name
 * 
 */
name?: string
/**
 * longitude
 * 
 */
longitude?: number
}
/**
 * skuId
 * 
 */
skuId?: string
}[]
}


interface IModels {

    /**
    * 数据模型：home_config
    */ 
    home_config: DataModelMethods<IModalHomeConfig>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}