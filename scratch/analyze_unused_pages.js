const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json', 'utf8'));

const unusedPagesFiles = data.unusedCodeFiles.filter(f => f.path.startsWith('pages/'));
console.log('Unused files under pages/ count:', unusedPagesFiles.length);
console.log('Unused files under pages/ total size:', (unusedPagesFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1), 'KB');

console.log('\nAll unused files under pages/ sorted by size:');
unusedPagesFiles.sort((a, b) => b.size - a.size).forEach(f => {
  console.log(`- ${f.path} (${(f.size / 1024).toFixed(1)} KB) [subPackage: ${f.subPackage}]`);
});
