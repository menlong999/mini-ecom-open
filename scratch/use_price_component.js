const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'pages/admin/after-service/detail/index.wxml',
    changes: [
      { from: /note="¥\{\{service\.applyAmount \|\| service\.amount \|\| '0'\}\}"/, to: '>\n        <price slot="note" price="{{service.applyAmount || service.amount || \'0\'}}" />\n      </t-cell>' }, // This requires careful replacement. I will do exact string replace for t-cells
    ]
  }
];

// Actually, writing a script that does exactly what I need using simple regex:
function replaceInFile(file, replacer) {
  const fullPath = path.join(__dirname, '../miniprogram', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let newContent = replacer(content);
    if (newContent !== content) {
      fs.writeFileSync(fullPath, newContent);
      console.log('Updated', file);
    }
  }
}

replaceInFile('app.json', (content) => {
  if (!content.includes('"price": "/components/price/index"')) {
    return content.replace('"usingComponents": {', '"usingComponents": {\n    "price": "/components/price/index",');
  }
  return content;
});

replaceInFile('pages/admin/after-service/detail/index.wxml', (content) => {
  return content
    .replace('note="¥{{service.applyAmount || service.amount || \'0\'}}"', '>\n        <price slot="note" price="{{service.applyAmount || service.amount || \'0\'}}" />\n      </t-cell><!--')
    .replace('/>\n      <view wx:if="{{actionState.canApprove}}">', '-->\n      <view wx:if="{{actionState.canApprove}}">')
    .replace('note="¥{{service.approvedAmount || \'-\'}}"', '>\n        <price slot="note" price="{{service.approvedAmount || \'-\'}}" />\n      </t-cell><!--')
    .replace('/>\n      <t-cell title="最终金额"', '-->\n      <t-cell title="最终金额"')
    .replace('<t-cell title="最终金额" note="¥{{service.amount || \'0\'}}" bordered="{{false}}" />', '<t-cell title="最终金额" bordered="{{false}}"><price slot="note" price="{{service.amount || \'0\'}}" /></t-cell>')
    .replace('<t-cell title="退款金额" note="¥{{service.refund.amount || \'0\'}}" bordered="{{false}}" />', '<t-cell title="退款金额" bordered="{{false}}"><price slot="note" price="{{service.refund.amount || \'0\'}}" /></t-cell>')
    .replace('<text class="goods-price">¥{{goods.price}}</text>', '<price class="goods-price" price="{{goods.price}}" />');
});

replaceInFile('pages/admin/after-service/list/index.wxml', content => {
  return content
    .replace('<text>退款金额: ¥{{item.amount || \'0\'}}</text>', '<view style="display:inline-flex;align-items:center;">退款金额: <price price="{{item.amount || \'0\'}}" /></view>')
    .replace('<text class="service-goods-price">¥{{goods.price}}</text>', '<price class="service-goods-price" price="{{goods.price}}" />');
});

replaceInFile('pages/admin/distributor-report/index.wxml', content => {
  return content
    .replace('<text class="summary-value">¥{{orderSummary.totalAmount}}</text>', '<price class="summary-value" price="{{orderSummary.totalAmount}}" />')
    .replace('<text class="order-amount">¥{{item.totalAmount}}</text>', '<price class="order-amount" price="{{item.totalAmount}}" />')
    .replace('<view class="goods-meta">¥{{goods.price}} x{{goods.quantity}}</view>', '<view class="goods-meta"><price style="display:inline-block" price="{{goods.price}}" /> x{{goods.quantity}}</view>');
});

replaceInFile('pages/admin/goods/list/index.wxml', content => {
  return content.replace('<view class="goods-price">¥{{item.minSalePrice}}</view>', '<price class="goods-price" price="{{item.minSalePrice}}" />');
});

replaceInFile('pages/admin/home-config/index.wxml', content => {
  return content.replace(/<view class="picker-sub">¥\{\{item.minSalePrice\}\}<\/view>/g, '<price class="picker-sub" price="{{item.minSalePrice}}" />');
});

replaceInFile('pages/admin/order/list/index.wxml', content => {
  return content
    .replace('<text class="order-goods-price">¥{{goods.price}}</text>', '<price class="order-goods-price" price="{{goods.price}}" />')
    .replace('<text>商品总额: ¥{{item.totalSalePrice || item.totalPayAmount || \'0\'}}</text>', '<view style="display:inline-flex;align-items:center;">商品总额: <price price="{{item.totalSalePrice || item.totalPayAmount || \'0\'}}" /></view>')
    .replace('<text>运费: ¥{{item.deliveryFee || \'0\'}}</text>', '<view style="display:inline-flex;align-items:center;">运费: <price price="{{item.deliveryFee || \'0\'}}" /></view>')
    .replace('<text>实付: ¥{{item.totalPayAmount || \'0\'}}</text>', '<view style="display:inline-flex;align-items:center;">实付: <price price="{{item.totalPayAmount || \'0\'}}" /></view>');
});

replaceInFile('pages/admin/report/index.wxml', content => {
  return content
    .replace('<text class="value">¥{{summary.day.salesAmount}}</text>', '<price class="value" price="{{summary.day.salesAmount}}" />')
    .replace('<text class="value">¥{{summary.week.salesAmount}}</text>', '<price class="value" price="{{summary.week.salesAmount}}" />')
    .replace('<text class="value">¥{{summary.month.salesAmount}}</text>', '<price class="value" price="{{summary.month.salesAmount}}" />')
    .replace(/<text class="col amount">¥\{\{item.salesAmount\}\}<\/text>/g, '<price class="col amount" price="{{item.salesAmount}}" />');
});

replaceInFile('pages/goods/list/index.wxml', content => {
  return content
    .replace('<text class="goods-price">¥{{item.price}}</text>', '<price class="goods-price" price="{{item.price}}" />')
    .replace('<text class="goods-origin-price" wx:if="{{item.originPrice}}">¥{{item.originPrice}}</text>', '<price class="goods-origin-price" type="delthrough" wx:if="{{item.originPrice}}" price="{{item.originPrice}}" />');
});

replaceInFile('pages/home/home.wxml', content => {
  return content
    .replace('<text class="goods-price">¥{{item.minSalePrice}}</text>', '<price class="goods-price" price="{{item.minSalePrice}}" />')
    .replace('>¥{{item.minLinePrice}}</text', '><price type="delthrough" price="{{item.minLinePrice}}" /></text');
});

replaceInFile('pages/order/pay-result/index.wxml', content => {
  return content.replace('<text wx:else>¥0.00</text>', '<price wx:else price="0" />');
});
