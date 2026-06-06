const fs = require('fs');
const path = require('path');

const files = [
  'pages/admin/after-service/detail/index.wxml',
  'pages/admin/after-service/list/index.wxml',
  'pages/admin/distributor-report/index.wxml',
  'pages/admin/goods/list/index.wxml',
  'pages/admin/home-config/index.wxml',
  'pages/admin/order/list/index.wxml',
  'pages/admin/report/index.wxml',
  'pages/goods/list/index.wxml',
  'pages/home/home.wxml',
  'pages/order/apply-service/index.wxml',
  'pages/order/pay-result/index.wxml'
];

const wxsInject = `<wxs src="/utils/price.wxs" module="priceFormat" />\n`;

files.forEach(file => {
  const fullPath = path.join(__dirname, '../miniprogram', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    let changed = false;
    
    if (!content.includes('price.wxs')) {
      content = wxsInject + content;
      changed = true;
    }
    
    // Replace ¥{{xxx}} with ¥{{priceFormat.format(xxx)}}
    // Regex matches ¥{{...}} but avoids already formatted ones or components
    // We only want to match simple bindings.
    const newContent = content.replace(/¥\{\{([^}]+)\}\}/g, (match, p1) => {
      if (p1.includes('priceFormat.format')) return match;
      return `¥{{priceFormat.format(${p1})}}`;
    });
    
    if (newContent !== content) {
      changed = true;
      content = newContent;
    }
    
    if (changed) {
      fs.writeFileSync(fullPath, content);
      console.log('Patched', file);
    }
  }
});
