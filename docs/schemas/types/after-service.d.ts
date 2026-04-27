
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalAfterService {
/**
 * reason
 * 
 */
reason?: string
/**
 * orderId
 * 
 */
orderId: string
/**
 * logistics
 * 
 */
logistics?: {
/**
 * companyCode
 * 
 */
companyCode?: string
/**
 * companyName
 * 
 */
companyName?: string
/**
 * logisticsNo
 * 
 */
logisticsNo?: string
/**
 * remark
 * 
 */
remark?: string
/**
 * updatedAt
 * 
 */
updatedAt?: number
}
/**
 * goods
 * 
 */
goods?: {
/**
 * specs
 * 
 */
specs?: string
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

}
/**
 * spuId
 * 
 */
spuId?: string
/**
 * title
 * 
 */
title?: string
/**
 * refundQuantity
 * 退的数量
 */
refundQuantity?: number
/**
 * skuId
 * 
 */
skuId?: string
}[]
/**
 * type
 * Service Type: 10 (Return Goods), 20 (Only Refund)
 * 
 */
type?: number
/**
 * reasonType
 * 
 */
reasonType?: number
/**
 * applyAmount
 * 用户申请退款金额
 */
applyAmount?: number
/**
 * audit
 * 
 */
audit?: {
/**
 * time
 * 
 */
time?: number
/**
 * approvedAmount
 * 管理员审批金额
 */
approvedAmount?: number
/**
 * reply
 * 
 */
reply?: string
/**
 * operator
 * 
 */
operator?: string
}
/**
 * rightsNo
 * 
 */
rightsNo?: string
/**
 * amount
 * 
 */
amount?: number
/**
 * images
 * 
 */
images?: string[]
/**
 * orderNo
 * 
 */
orderNo?: string
/**
 * quantity
 * 
 */
quantity?: number
/**
 * history
 * 
 */
history?: {
/**
 * remark
 * 
 */
remark?: string
/**
 * time
 * 
 */
time?: number
/**
 * operator
 * 
 */
operator?: string
/**
 * status
 * 
 */
status?: number
}[]
/**
 * status
 * Status: 
 * 10 (Pending Audit), 
 * 20 (Approved), 
 * 30 (Received), 
 * 50 (Completed), 
 * 60 (Closed/Refused)
 */
status?: number
/**
 * desc
 * 
 */
desc?: string
/**
 * refund
 * 
 */
refund?: {
/**
 * requestTime
 * 
 */
requestTime?: number
/**
 * totalAmount
 * 
 */
totalAmount?: number
/**
 * amount
 * 
 */
amount?: number
/**
 * outRefundNo
 * 
 */
outRefundNo?: string
/**
 * traceNo
 * 
 */
traceNo?: string
/**
 * errorReason
 * 
 */
errorReason?: string
/**
 * time
 * 
 */
time?: number
/**
 * requestAmount
 * 
 */
requestAmount?: number
/**
 * refundId
 * 
 */
refundId?: string
/**
 * transactionId
 * 
 */
transactionId?: string
/**
 * status
 * 
 */
status?: string
}
}


interface IModels {

    /**
    * 数据模型：after-service
    */ 
    after_service: DataModelMethods<IModalAfterService>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}