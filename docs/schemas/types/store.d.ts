
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalStore {
/**
 * businessHours
 * 
 */
businessHours?: string
/**
 * geoLoc
 * 
 */
geoLoc?: {
/**
 * 地点
 * undefined
 */
address: string
/**
 * 经纬度
 * undefined
 */
geopoint: {
coordinates: number[]
type: string
}
}
/**
 * phone
 * 
 */
phone?: string
/**
 * name
 * 
 */
name?: string
/**
 * status
 * 1：开
 * 0：闭店
 */
status?: number
}


interface IModels {

    /**
    * 数据模型：store
    */ 
    store: DataModelMethods<IModalStore>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}