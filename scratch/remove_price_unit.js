const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules')) {
        results = results.concat(walkDir(file));
      }
    } else {
      if (file.endsWith('.wxml')) {
        results.push(file);
      }
    }
  });
  return results;
}

const miniprogramPath = path.join(__dirname, '../miniprogram');
const files = walkDir(miniprogramPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/priceUnit="yuan"/g, '');
  newContent = newContent.replace(/priceUnit='yuan'/g, '');
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log('Removed priceUnit="yuan" from', file);
  }
});
