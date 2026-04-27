
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalAddress {
/**
 * districtCode
 * 
 */
districtCode?: string
/**
 * districtName
 * 
 */
districtName?: string
/**
 * cityCode
 * 
 */
cityCode?: string
/**
 * provinceCode
 * 
 */
provinceCode?: string
/**
 * isValid
 * 
 */
isValid?: boolean
/**
 * addressTag
 * 
 */
addressTag?: string
/**
 * isDefault
 * 
 */
isDefault?: boolean
/**
 * cityName
 * 
 */
cityName?: string
/**
 * phone
 * 
 */
phone?: string
/**
 * fullAddress
 * 
 */
fullAddress?: string
/**
 * name
 * 
 */
name?: string
/**
 * detailAddress
 * 
 */
detailAddress?: string
/**
 * _id
 * 
 */
_id?: string
/**
 * provinceName
 * 
 */
provinceName?: string
}


interface IModels {

    /**
    * 数据模型：address
    */ 
    address: DataModelMethods<IModalAddress>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}