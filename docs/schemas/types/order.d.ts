
import { DataModelMethods } from "@cloudbase/wx-cloud-client-sdk";
interface IModalOrder {
/**
 * payTime
 * 
 */
payTime?: number
/**
 * goodsList
 * 
 */
goodsList?: {
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
 * specs
 * 
 */
specs?: string
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
 * afterServiceStatus
 * 
 */
afterServiceStatus?: number
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
 * skuId
 * 
 */
skuId?: string
/**
 * afterServiceId
 * 
 */
afterServiceId?: string
/**
 * rightsNo
 * 
 */
rightsNo?: string
}[]
/**
 * orderRemark
 * 
 */
orderRemark?: string
/**
 * logistics
 * 发货物流信息
 */
logistics?: {
/**
 * companyCode
 * 物流公司代码
 */
companyCode?: string
/**
 * openid
 * 发货人的 openid
 */
openid?: string
/**
 * companyName
 * 物流公司名称
 */
companyName?: string
/**
 * logisticsNo
 * 物流单号
 */
logisticsNo?: string
/**
 * remark
 * 备注
 */
remark?: string
/**
 * operator
 * 发货人的 nickName
 */
operator?: string
/**
 * updatedAt
 * 更新时间
 */
updatedAt?: number
}
/**
 * distributorOpenid
 * 推荐 openid
 */
distributorOpenid?: string
/**
 * receiptTime
 * 确认收货时间
 */
receiptTime?: number
/**
 * distributorNickName
 * 
 */
distributorNickName?: string
/**
 * isCommented
 * 
 */
isCommented?: boolean
/**
 * selectedCoupons
 * 
 */
selectedCoupons?: string[]
/**
 * invoiceData
 * 
 */
invoiceData?: {
/**
 * titleType
 * 0：个人
 * 1：公司
 */
titleType?: number
/**
 * buyerPhone
 * 
 */
buyerPhone?: string
/**
 * buyerTaxNo
 * 
 */
buyerTaxNo?: string
/**
 * invoiceType
 * 0：不开发票
 * 1：电子发票
 */
invoiceType?: number
/**
 * buyerName
 * 
 */
buyerName?: string
/**
 * contentType
 * 0：商品明细
 * 1：商品类别
 */
contentType?: number
/**
 * email
 * 
 */
email?: string
}
/**
 * orderNo
 * 
 */
orderNo?: string
/**
 * shippedTime
 * 发货时间，后台或者在管理端设置
 */
shippedTime?: number
/**
 * pickupStore
 * 
 */
pickupStore?: {
/**
 * pickupPhone
 * 
 */
pickupPhone?: string
/**
 * storeName
 * 
 */
storeName?: string
/**
 * storeId
 * 
 */
storeId?: string
/**
 * pickupName
 * 
 */
pickupName?: string
}
/**
 * deliveryType
 * 1：快递
 * 2：自提
 */
deliveryType?: number
/**
 * orderSummary
 * 
 */
orderSummary?: {
/**
 * couponAmount
 * 
 */
couponAmount?: string
/**
 * deliveryFee
 * 
 */
deliveryFee?: string
/**
 * totalGoodsCount
 * 
 */
totalGoodsCount?: number
/**
 * totalSalePrice
 * 
 */
totalSalePrice?: string
/**
 * invoiceSupport
 * 
 */
invoiceSupport?: boolean
/**
 * totalPayAmount
 * 
 */
totalPayAmount?: string
/**
 * promotionAmount
 * 
 */
promotionAmount?: string
}
/**
 * userId
 * 
 */
userId?: string
/**
 * userAddress
 * 
 */
userAddress?: {
/**
 * address
 * 
 */
address?: string
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
 * updateTime
 * 
 */
updateTime?: string
/**
 * addressId
 * 
 */
addressId?: string
/**
 * isDefault
 * 
 */
isDefault?: number
/**
 * phoneNumber
 * 
 */
phoneNumber?: string
/**
 * cityName
 * 
 */
cityName?: string
/**
 * createTime
 * 
 */
createTime?: string
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
 * id
 * 
 */
id?: string
/**
 * provinceName
 * 
 */
provinceName?: string
/**
 * tag
 * 
 */
tag?: string
}
/**
 * wechatPayInfo
 * 微信支付回调后补充
 */
wechatPayInfo?: {
/**
 * timeEnd
 * 
 */
timeEnd?: string
/**
 * cashFee
 * 
 */
cashFee?: number
/**
 * totalFee
 * 
 */
totalFee?: number
/**
 * transactionId
 * 
 */
transactionId?: string
}
/**
 * cancelReson
 * 
 */
cancelReson?: number
/**
 * deleted
 * 
 */
deleted?: boolean
/**
 * cancelTime
 * 取消订单时间
 */
cancelTime?: number
/**
 * deleteTime
 * 
 */
deleteTime?: number
/**
 * cancelResonDesc
 * 
 */
cancelResonDesc?: string
/**
 * _id
 * 
 */
_id?: string
/**
 * status
 * 
 */
status?: string
}


interface IModels {

    /**
    * 数据模型：order
    */ 
    order: DataModelMethods<IModalOrder>;    
}

declare module "@cloudbase/wx-cloud-client-sdk" {
    interface OrmClient extends IModels {}
}

declare global {
    interface WxCloud {
        models: IModels;
    }
}