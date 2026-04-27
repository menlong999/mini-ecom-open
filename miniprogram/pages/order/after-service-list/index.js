import { fetchServiceList, getAfterServiceButtons } from '../../../services/order/afterService';
import {
  AfterServiceStatus,
  ServiceType,
  ServiceTypeDesc,
} from '../../../services/order/orderConfig';

const formatSpecs = (goods) => {
  if (!goods) return '';
  if (Array.isArray(goods.specs)) return goods.specs.join(' / ');
  if (typeof goods.specs === 'string' && goods.specs) return goods.specs;
  if (Array.isArray(goods.specInfo)) {
    return goods.specInfo
      .map((s) => s.specValue || '')
      .filter(Boolean)
      .join(' / ');
  }
  return '';
};

Page({
  page: {
    size: 10,
    num: 1,
  },

  data: {
    tabs: [
      {
        key: -1,
        text: '全部',
      },
      {
        key: AfterServiceStatus.TO_AUDIT,
        text: '待审核',
      },
      {
        key: AfterServiceStatus.THE_APPROVED,
        text: '已审核',
      },
      {
        key: AfterServiceStatus.COMPLETE,
        text: '已完成',
      },
      {
        key: AfterServiceStatus.CLOSED,
        text: '已关闭',
      },
      {
        key: AfterServiceStatus.REFUND_ABNORMAL,
        text: '退款异常',
      },
    ],
    curTab: -1,
    dataList: [],
    listLoading: 0, // 0-未加载，1-加载中，2-已全部加载
    pullDownRefreshing: false, // 下拉刷新时不显示load-more
    emptyImg: '',
    backRefresh: false,
  },

  onLoad(query) {
    let status = parseInt(query.status);
    status = this.data.tabs.map((t) => t.key).includes(status) ? status : -1;
    this.init(status);
    this.pullDownRefresh = this.selectComponent('#wr-pull-down-refresh');
  },

  onShow() {
    // 当从其他页面返回，并且 backRefresh 被置为 true 时，刷新数据
    if (!this.data.backRefresh) return;
    this.handleRefresh();
    this.setData({
      backRefresh: false,
    });
  },

  onReachBottom() {
    if (this.data.listLoading === 0) {
      this.loadAfterServiceList(this.data.curTab);
    }
  },

  onPullDownRefresh(e) {
    this.pullDownRefresh && this.pullDownRefresh.onPageScroll(e);
  },

  handlePullDownRefresh(e) {
    const { callback } = e.detail;
    this.setData({
      pullDownRefreshing: true,
    }); // 下拉刷新时不显示load-more
    this.refreshList(this.data.curTab)
      .then(() => {
        this.setData({
          pullDownRefreshing: false,
        });
        callback && callback();
      })
      .catch((err) => {
        this.setData({
          pullDownRefreshing: false,
        });
        Promise.reject(err);
      });
  },

  init(status) {
    status = status !== undefined ? status : this.data.curTab;
    this.refreshList(status);
  },

  loadAfterServiceList(statusCode = -1, reset = false) {
    const params = {
      pageSize: this.page.size,
      page: this.page.num,
      status: statusCode,
    };

    this.setData({ listLoading: 1 });

    return fetchServiceList(params)
      .then((res) => {
        this.page.num++;
        let dataList = [];
        const { list = [] } = res;

        // 状态描述映射
        const statusMap = {
          [AfterServiceStatus.TO_AUDIT]: '待审核',
          [AfterServiceStatus.THE_APPROVED]: '已审核',
          [AfterServiceStatus.HAVE_THE_GOODS]: '已收货',
          [AfterServiceStatus.ABNORMAL_RECEIVING]: '收货异常',
          [AfterServiceStatus.COMPLETE]: '已完成',
          [AfterServiceStatus.CLOSED]: '已关闭',
          [AfterServiceStatus.REFUND_ABNORMAL]: '退款异常',
        };

        // 适配订单级售后数据模型
        dataList = list.map((item) => {
          const rawGoodsList = Array.isArray(item.goods)
            ? item.goods
            : item.goods
            ? [item.goods]
            : [];
          const goodsList = rawGoodsList.map((goods) => ({
            id: goods.skuId,
            thumb: goods.thumb,
            title: goods.title,
            specs: formatSpecs(goods),
            itemRefundAmount: goods.price || 0,
            rightsQuantity: goods.refundQuantity || goods.quantity || 0,
          }));

          return {
            rightsNo: item.rightsNo,
            type: item.type,
            typeDesc: ServiceTypeDesc[item.type],
            typeDescIcon: item.type === ServiceType.ONLY_REFUND ? 'goods_refund' : 'goods_return',
            status: item.status,
            statusName: statusMap[item.status] || '处理中',
            statusDesc:
              item.status === AfterServiceStatus.TO_AUDIT
                ? '您的售后申请已提交'
                : item.status === AfterServiceStatus.REFUND_ABNORMAL
                ? '退款异常/关闭，请联系客服'
                : statusMap[item.status],
            amount: item.amount,
            goodsList,
            buttons: getAfterServiceButtons({
              status: item.status,
              type: item.type,
              logisticsNo: item.logistics ? item.logistics.logisticsNo : '',
            }),
            logisticsNo: item.logistics ? item.logistics.logisticsNo : '',
            logisticsCompanyName: item.logistics ? item.logistics.companyName : '',
            logisticsCompanyCode: item.logistics ? item.logistics.companyCode : '',
            remark: item.logistics ? item.logistics.remark : '',
            logistics: item.logistics || {},
          };
        });

        return new Promise((resolve) => {
          if (reset) {
            this.setData({ dataList: [] }, () => resolve());
          } else resolve();
        }).then(() => {
          this.setData({
            dataList: this.data.dataList.concat(dataList),
            listLoading: dataList.length > 0 ? 0 : 2,
          });
        });
      })
      .catch((err) => {
        this.setData({ listLoading: 3 });
        return Promise.reject(err);
      });
  },

  handleRetryLoad() {
    this.loadAfterServiceList(this.data.curTab);
  },

  handleTabChange(e) {
    const { value } = e.detail;
    const tab = this.data.tabs.find((v) => v.key === value);
    if (!tab) return;
    this.refreshList(value);
  },

  refreshList(status = -1) {
    this.page = {
      size: 10,
      num: 1,
    };
    this.setData({
      curTab: status,
      dataList: [],
    });
    return this.loadAfterServiceList(status, true);
  },

  handleRefresh() {
    this.refreshList(this.data.curTab);
  },

  // 点击订单卡片
  handleCardTap(e) {
    wx.navigateTo({
      url: `/pages/order/after-service-detail/index?rightsNo=${e.currentTarget.dataset.order.rightsNo}`,
    });
  },
});
