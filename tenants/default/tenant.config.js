module.exports = {
  app: {
    name: "极简电商",
    description: "可配置的开源电商小程序",
    permissionDesc: "用于订单配送、地址选择和门店自提",
  },
  cloud: {
    envId: "",
  },
  wechat: {
    appId: "",
    projectName: "retail-oss",
    projectDescription: "开源电商小程序",
  },
  assets: {
    cdnBase:
      "https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-mp",
  },
  afterService: {
    returnAddress: {
      name: "",
      phone: "",
      address: "",
    },
  },
  customerService: {
    phone: "",
    serviceTimeDuration: "工作时间内为你服务",
    showOnlineChat: true,
  },
  features: {
    distributor: true,
    pickup: true,
  },
  logistics: {
    // 如果启用物流轨迹查询，这里的 code 必须与微信物流助手后台已绑定的 deliveryId 一致。
    companies: [
      { name: "中通快递", code: "ZTO", phone: "95311" },
      { name: "圆通速递", code: "YTO", phone: "95554" },
      { name: "韵达速递", code: "YUNDA", phone: "95546" },
      { name: "申通快递", code: "STO", phone: "95543" },
      { name: "极兔速递", code: "JTSD", phone: "956025" },
      { name: "顺丰速运", code: "SF", phone: "95338" },
      { name: "邮政快递包裹", code: "EMS", phone: "11183" },
      { name: "京东物流", code: "JD", phone: "950616" },
      { name: "德邦快递", code: "DBL", phone: "95353" },
      { name: "百世快递", code: "BEST", phone: "95320" },
    ],
  },
  order: {
    shipping: {
      defaultFee: 10,
      freeShippingThreshold: 99,
    },
  },
  payment: {
    workflowName: "",
    refundWorkflowName: "",
  },
  qrcode: {
    page: "pages/home/home",
    checkPath: false,
    envVersion: "develop",
    width: 430,
    cloudPathPrefix: "qrcodes",
  },
};
