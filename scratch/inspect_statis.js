const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json', 'utf8'));

console.log('Statis contents:', JSON.stringify(data.statis, null, 2));
