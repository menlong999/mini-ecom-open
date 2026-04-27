module.exports = {
  // 这里只写和公共默认值不同的字段。
  app: {
    name: "你的品牌名",
    description: "你的品牌描述",
    permissionDesc: "你的定位权限说明",
  },
  cloud: {
    envId: "你的-cloud-env-id",
  },
  wechat: {
    appId: "你的微信小程序 appid",
    projectName: "你的项目名",
    projectDescription: "你的项目描述",
  },
  afterService: {
    returnAddress: {
      name: "售后收件人",
      phone: "售后联系电话",
      address: "售后退货地址",
    },
    reasonList: [
      { id: 1, desc: "实际商品与描述不符" },
      { id: 2, desc: "质量问题" },
      { id: 3, desc: "商家发错货" },
    ],
  },
  customerService: {
    phone: "你的客服电话",
    serviceTimeDuration: "例如 9:00-18:00",
  },
  features: {
    invoice: true,
  },
  invoice: {
    notice: [
      "请根据你的开票规则填写发票须知。",
      "如需开具特殊类型发票，请先联系商家客服确认。",
    ],
    taxCodeNotice: ["企业抬头发票请确认名称与税号一致，避免影响开票。"],
  },
  payment: {
    workflowName: "你的支付工作流名称",
    refundWorkflowName: "你的退款工作流名称",
  },
  logistics: {
    // 这里只保留当前租户实际启用的物流公司。
    // code 必须与微信物流助手后台已绑定的物流公司 deliveryId 一致，否则无法查询物流轨迹。
    companies: [
      { name: "顺丰速运", code: "SF", phone: "95338" },
      { name: "中通快递", code: "ZTO", phone: "95311" },
    ],
  },
  qrcode: {
    envVersion: "trial",
  },
};
