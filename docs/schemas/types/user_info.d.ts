
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalUserInfo {
/**
 * role
 * admin：管理员
 * user：普通用户，默认值
 */
role?: string
/**
 * gender
 * 1：男
 * 2：女
 * 3：不展示
 */
gender?: number
/**
 * avatarUrl
 * 
 */
avatarUrl?: string
/**
 * nickName
 * 
 */
nickName?: string
/**
 * distriRejectedAt
 * 
 */
distributorRejectedAt?: number
/**
 * referrerScene
 * 
 */
referrerScene?: string
/**
 * distributorQrFileId
 * 
 */
distributorQrFileId?: string
/**
 * referrerAt
 * 
 */
referrerAt?: number
/**
 * referrerOpenid
 * 
 */
referrerOpenid?: string
/**
 * phoneNumber
 * 
 */
phoneNumber?: string
/**
 * distributorApplyAt
 * 
 */
distributorApplyAt?: number
/**
 * distributorStatus
 * 'PENDING' | 'APPROVED' | 'REJECTED'
 */
distributorStatus?: string
/**
 * distriRejectReason
 * 
 */
distributorRejectReason?: string
}


interface IModels {

    /**
    * 数据模型：user_info
    */ 
    user_info: DataModelMethods<IModalUserInfo>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}