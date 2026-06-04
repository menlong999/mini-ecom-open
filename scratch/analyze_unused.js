const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json', 'utf8'));

console.log('Unused files count:', data.unusedCodeFiles.length);

// Let's classify unused files by extension and directory
const fileTypes = {};
const directories = {};

data.unusedCodeFiles.forEach(f => {
  fileTypes[f.ext] = (fileTypes[f.ext] || 0) + 1;
  const parts = f.path.split('/');
  const dir = parts.length > 1 ? parts[0] : 'root';
  directories[dir] = (directories[dir] || 0) + 1;
});

console.log('Unused file types:', fileTypes);
console.log('Unused files by root directory:', directories);

console.log('\nTop 30 largest unused files:');
data.unusedCodeFiles.sort((a, b) => b.size - a.size).slice(0, 30).forEach(f => {
  console.log(`- ${f.path} (${(f.size / 1024).toFixed(1)} KB) [subPackage: ${f.subPackage}]`);
});
