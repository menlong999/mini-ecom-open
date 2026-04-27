
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalComments {
/**
 * commentResources
 * 
 */
commentResources?: {
/**
 * src
 * 
 */
src?: string
/**
 * coverSrc
 * 
 */
coverSrc?: string
/**
 * type
 * 
 */
type?: string
}[]
/**
 * commentScore
 * 
 */
commentScore?: number
/**
 * goods
 * 
 */
goods?: {
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
 * price
 * 
 */
price?: number
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
 * title
 * 
 */
title?: string
}
/**
 * commentContent
 * 
 */
commentContent?: string
/**
 * userName
 * 
 */
userName?: string
/**
 * userHeadUrl
 * 
 */
userHeadUrl?: string
/**
 * sellerReply
 * 
 */
sellerReply?: string
/**
 * specs
 * 
 */
specs?: string
/**
 * isAnonymity
 * 
 */
isAnonymity?: boolean
/**
 * isAutoComment
 * 
 */
isAutoComment?: boolean
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
    * 数据模型：comments
    */ 
    comments: DataModelMethods<IModalComments>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}