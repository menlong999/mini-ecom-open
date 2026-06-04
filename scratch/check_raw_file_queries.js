const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json', 'utf8'));

// Let's find all occurrences of the old path in the entire json
const jsonString = JSON.stringify(data);
const oldPathOccurrences = [];
const regex = /"request"\s*:\s*"[^"]*services\/address\/address[^"]*"/g;
let match;
while ((match = regex.exec(jsonString)) !== null) {
  oldPathOccurrences.push(match[0]);
}

console.log('Occurrences of services/address/address in JSON:', oldPathOccurrences);

// Let's check the size and content of files inside the json
const editIndexJs = data.files.find(f => f.path === 'pages/user/address/edit/index.js');
if (editIndexJs) {
  console.log('File pages/user/address/edit/index.js inside JSON:', editIndexJs);
} else {
  console.log('File pages/user/address/edit/index.js not found in files list!');
}
