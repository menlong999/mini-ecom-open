import Toast from 'tdesign-miniprogram/toast/index';
import { addCart } from '../../../../services/cart/cart';
import { confirmReceipt } from '../../../../services/order/orderDetail';
import Dialog from 'tdesign-miniprogram/dialog/index';
import { OrderButtonTypes } from '../../../../services/order/orderConfig';

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {
    order: {
      type: Object,
      observer(order) {
        // 判定有传goodsIndex ，则认为是商品button bar, 仅显示申请售后按钮
        if (this.properties && this.properties.goodsIndex !== null) {
          const goods = order.goodsList[Number(this.properties.goodsIndex)];
          this.setData({
            buttons: {
              left: [],
              right: (goods.buttons || []).filter((b) => b.type == OrderButtonTypes.APPLY_REFUND),
            },
          });
          return;
        }
        // 订单的button bar 不显示申请售后按钮
        const buttonsRight = (order.buttons || []).map((button) => {
          return button;
        });
        // 删除订单按钮单独挪到左侧
        const deleteBtnIndex = buttonsRight.findIndex((b) => b.type === OrderButtonTypes.DELETE);
        let buttonsLeft = [];
        if (deleteBtnIndex > -1) {
          buttonsLeft = buttonsRight.splice(deleteBtnIndex, 1);
        }
        this.setData({
          buttons: {
            left: buttonsLeft,
            right: buttonsRight,
          },
        });
      },
    },
    goodsIndex: {
      type: Number,
      value: null,
    },
    isBtnMax: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    order: {},
    buttons: {
      left: [],
      right: [],
    },
  },

  methods: {
    // 点击【订单操作】按钮，根据按钮类型分发
    onOrderBtnTap(e) {
      const { type, disabled } = e.currentTarget.dataset;
      const isDisabled = disabled === true || disabled === 'true';
      if (isDisabled) return;
      switch (type) {
        case OrderButtonTypes.DELETE:
          this.onDelete(this.data.order);
          break;
        case OrderButtonTypes.CANCEL:
          this.onCancel(this.data.order);
          break;
        case OrderButtonTypes.CONFIRM:
          this.onConfirm(this.data.order);
          break;
        case OrderButtonTypes.PAY:
          this.onPay(this.data.order);
          break;
        case OrderButtonTypes.APPLY_REFUND:
          this.onApplyRefund(this.data.order, e);
          break;
        case OrderButtonTypes.VIEW_REFUND:
          this.onViewRefund(this.data.order);
          break;
        case OrderButtonTypes.COMMENT:
          this.onAddComment(this.data.order);
          break;
        case OrderButtonTypes.INVITE_GROUPON:
          //分享邀请好友拼团
          break;
        case OrderButtonTypes.REBUY:
          this.onBuyAgain(this.data.order);
          break;
        case OrderButtonTypes.VIEW_LOGISTICS:
          this.onViewLogistics(this.data.order);
          break;
      }
    },

    onViewLogistics(order) {
      // 1=正常订单物流, 2=售后物流
      const logistics = order.logistics || {};
      const logisticsNo = logistics.logisticsNo;
      const companyName = logistics.companyName;
      const companyCode = logistics.companyCode;
      if (!logisticsNo) {
        Toast({ context: this, selector: '#t-toast', message: '暂无物流信息' });
        return;
      }
      wx.navigateTo({
        url: `/pages/order/delivery-detail/index?logisticsNo=${logisticsNo}&companyName=${
          companyName || ''
        }&companyCode=${companyCode || ''}&source=1`,
      });
    },

    onCancel(order) {
      console.log('Cancelling order:', order);
      this.triggerEvent('onCancelOrder', { order });
    },
    onDelete(order) {
      console.log('Deleting order:', order);
      this.triggerEvent('onDeleteOrder', { order });
    },

    onConfirm() {
      console.log('Confirming receipt for order:', this.data.order);
      const orderId = this.data.order._id || this.data.order.orderId;
      if (!orderId) {
        Toast({ context: this, selector: '#t-toast', message: '订单ID缺失' });
        return;
      }
      Dialog.confirm({
        title: '确认是否已经收到货？',
        content: '',
        confirmBtn: '确认收货',
        cancelBtn: '取消',
      })
        .then(async () => {
          try {
            wx.showLoading({ title: '处理中...' });
            await confirmReceipt(orderId);
            wx.hideLoading();
            Toast({
              context: this,
              selector: '#t-toast',
              message: '已确认收货',
              icon: 'check-circle',
            });
            // 触发列表/详情刷新
            this.triggerEvent('onConfirmReceipt', { order: this.data.order });
          } catch (err) {
            wx.hideLoading();
            console.error('Confirm receipt failed:', err);
            Toast({
              context: this,
              selector: '#t-toast',
              message: '操作失败，请重试',
              theme: 'error',
            });
          }
        })
        .catch(() => {
          // Cancelled
        });
    },

    onPay(order) {
      console.log('Initiating payment');
      this.triggerEvent('onPayOrder', { order });
    },

    async onBuyAgain(order) {
      if (!order || !order.goodsList || !order.goodsList.length) return;

      wx.showLoading({ title: '加入购物车...' });

      try {
        const userInfo = wx.getStorageSync('userInfo');
        const openId = userInfo && userInfo._openid;

        if (!openId) {
          Toast({ context: this, selector: '#t-toast', message: '请先登录' });
          return;
        }

        const promises = order.goodsList.map((item) => {
          // 构造购物车所需商品数据结构 (参照 cart 数据模型)
          const cartItem = {
            userId: openId,
            title: item.title,
            thumb: item.thumb,
            price: item.price,
            quantity: item.quantity,
            spuId: item.spuId,
            skuId: item.skuId,
            specInfo: item.specInfo || [],
            specs: item.specs, // WXML 中使用
            isSelected: true,
            valid: true,
          };
          return addCart(openId, cartItem);
        });

        await Promise.all(promises);

        wx.hideLoading();
        Toast({ context: this, selector: '#t-toast', message: '已加入购物车' });

        // 跳转到购物车页面 (Assuming cart is a tab page)
        setTimeout(() => {
          wx.switchTab({ url: '/pages/cart/index' });
        }, 1000);
      } catch (err) {
        wx.hideLoading();
        console.error('Buy again failed:', err);
        Toast({ context: this, selector: '#t-toast', message: '加入购物车失败', theme: 'error' });
      }
    },

    onApplyRefund(order, e) {
      console.log('Applying refund for order:', order, this.properties.goodsIndex);
      let preselectSkuId = '';
      if (this.properties.goodsIndex !== null) {
        const goods = order.goodsList[Number(this.properties.goodsIndex)];
        if (goods) preselectSkuId = goods.skuId;
      }
      const dataset = (e && e.currentTarget && e.currentTarget.dataset) || {};
      const serviceType = dataset.serviceType ? String(dataset.serviceType) : '';
      const hasCanApplyReturn = dataset.canApplyReturn !== undefined;
      const canApplyReturnValue = hasCanApplyReturn ? String(dataset.canApplyReturn) : '';

      let url = `/pages/order/apply-service/index?orderId=${order.orderId}`;
      if (preselectSkuId) {
        url += `&skuId=${preselectSkuId}`;
      }
      if (serviceType) {
        url += `&serviceType=${serviceType}`;
      }
      if (hasCanApplyReturn) {
        url += `&canApplyReturn=${canApplyReturnValue}`;
      }

      wx.navigateTo({
        url,
      });
    },

    onViewRefund(order) {
      console.log('Viewing refund for order:', order);

      // 1. 如果是商品维度的按钮触发
      if (this.properties.goodsIndex !== null) {
        const goods = order.goodsList[Number(this.properties.goodsIndex)];
        if (goods && goods.rightsNo) {
          wx.navigateTo({
            url: `/pages/order/after-service-detail/index?rightsNo=${goods.rightsNo}`,
          });
          return;
        }
      }

      // 2. 订单维度的按钮
      // 查找第一个有售后单号的商品
      const goodsWithService = (order.goodsList || []).find((g) => g.rightsNo);

      if (goodsWithService) {
        wx.navigateTo({
          url: `/pages/order/after-service-detail/index?rightsNo=${goodsWithService.rightsNo}`,
        });
      } else {
        // Fallback just in case
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未找到售后单号',
          theme: 'error',
        });
      }
    },

    /** 添加订单评论 */
    onAddComment(order) {
      wx.setStorageSync('currentEvaluateOrder', order);
      wx.navigateTo({
        url: '/pages/goods/comments/create/index',
      });
    },
  },
});
