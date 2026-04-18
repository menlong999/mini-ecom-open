import { OrderStatus, OrderButtonTypes, ServiceType } from '../services/order/orderConfig';

/**
 * 获取订单状态描述
 * @param {string} status
 */
export const getOrderStatusDesc = (status, deliveryType) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return '待支付';
    case OrderStatus.PENDING_DELIVERY:
      return Number(deliveryType) === 2 ? '待提货' : '待发货';
    case OrderStatus.PENDING_RECEIPT:
      return '待确认收货';
    case OrderStatus.COMPLETE:
      return '已完成订单';
    case OrderStatus.PAYMENT_TIMEOUT:
      return '已取消（未支付）';
    case OrderStatus.CANCELED_NOT_PAYMENT:
    case OrderStatus.CANCELED_PAYMENT:
    case OrderStatus.CANCELED_REJECTION:
      return '订单已取消';
    default:
      return '未知状态';
  }
};

/**
 * 获取订单操作按钮列表
 * @param {string} status
 * @param {boolean} hasAfterService 是否有售后记录
 * @param {boolean} hasAfterServiceInProgress 是否有进行中的售后
 */
/**
 * 获取订单操作按钮列表
 * @param {string} status
 * @param {boolean} hasAfterService 是否有售后记录
 * @param {boolean} isCommented 是否已评价
 * @param {boolean} hasAfterServiceInProgress 是否有进行中的售后
 */
export const getOrderButtons = (
  status,
  hasAfterService = false,
  isCommented = false,
  hasAfterServiceInProgress = false
) => {
  // 售后按钮配置
  const afterServiceBtn = hasAfterService
    ? {
        name: '查看售后',
        type: OrderButtonTypes.VIEW_REFUND,
        primary: false,
        disabled: false,
        openType: '',
        dataShare: null,
      }
    : {
        name: '申请售后',
        type: OrderButtonTypes.APPLY_REFUND,
        primary: false,
        disabled: false,
        openType: '',
        dataShare: null,
        serviceType: ServiceType.RETURN_GOODS,
        canApplyReturn: true,
      };

  switch (status) {
    case OrderStatus.PENDING_PAYMENT: // 待支付
      return [
        {
          name: '取消订单',
          type: OrderButtonTypes.CANCEL,
          primary: false,
          disabled: false,
          openType: '',
          dataShare: null,
        },
        {
          name: '去支付',
          type: OrderButtonTypes.PAY,
          primary: true,
          disabled: false,
          openType: '',
          dataShare: null,
        },
      ];
    case OrderStatus.PENDING_DELIVERY: // 待发货
      return [
        {
          name: hasAfterService ? '查看退款' : '申请退款', // 发货前叫申请退款
          type: hasAfterService ? OrderButtonTypes.VIEW_REFUND : OrderButtonTypes.APPLY_REFUND,
          primary: false,
          disabled: false,
          openType: '',
          dataShare: null,
          serviceType: hasAfterService ? undefined : ServiceType.ONLY_REFUND,
          canApplyReturn: false,
        },
      ];
    case OrderStatus.PENDING_RECEIPT: // 待收货
      return [
        {
          name: '查看物流',
          type: OrderButtonTypes.VIEW_LOGISTICS,
          primary: false,
          disabled: false,
          openType: '',
          dataShare: null,
        },
        {
          name: hasAfterServiceInProgress ? '售后处理中' : '确认收货',
          type: OrderButtonTypes.CONFIRM,
          primary: true,
          disabled: hasAfterServiceInProgress,
          openType: '',
          dataShare: null,
        },
      ];
    case OrderStatus.COMPLETE: {
      // 已完成/待评价
      const list = [
        afterServiceBtn,
        {
          name: '再次购买',
          type: OrderButtonTypes.REBUY,
          primary: false,
          disabled: false,
          openType: '',
          dataShare: null,
        },
      ];
      // 如果未评价，显示评价按钮
      if (!isCommented) {
        list.push({
          name: '评价',
          type: OrderButtonTypes.COMMENT,
          primary: true,
          disabled: false,
          openType: '',
          dataShare: null,
        });
      }
      return list;
    }
    case OrderStatus.PAYMENT_TIMEOUT: // 支付超时
      return [
        {
          name: '删除订单',
          type: OrderButtonTypes.DELETE,
          primary: false,
          disabled: false,
          openType: '',
          dataShare: null,
        },
      ];
    case OrderStatus.CANCELED_NOT_PAYMENT: // 主动取消
    case OrderStatus.CANCELED_PAYMENT: // 主动取消
    case OrderStatus.CANCELED_REJECTION: // 拒收
      return [
        {
          name: '删除订单',
          type: OrderButtonTypes.DELETE,
          primary: true,
          disabled: false,
          openType: '',
          dataShare: null,
        },
      ];
    default:
      return [];
  }
};
