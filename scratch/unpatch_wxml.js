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

files.forEach(file => {
  const fullPath = path.join(__dirname, '../miniprogram', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    let changed = false;
    
    // Remove wxs inject
    const wxsInject = `<wxs src="/utils/price.wxs" module="priceFormat" />\n`;
    if (content.startsWith(wxsInject)) {
      content = content.replace(wxsInject, '');
      changed = true;
    }
    
    // Revert priceFormat.format(xxx) back to xxx
    const newContent = content.replace(/priceFormat\.format\(([^)]+)\)/g, '$1');
    if (newContent !== content) {
      changed = true;
      content = newContent;
    }
    
    if (changed) {
      fs.writeFileSync(fullPath, content);
      console.log('Reverted', file);
    }
  }
});
