const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json', 'utf8'));

// 1. Files in main package
const mainPkgFiles = data.files.filter(f => !f.subPackage);
console.log('Main Package total size in JSON:', (mainPkgFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2), 'MB');
console.log('Main Package file count:', mainPkgFiles.length);

// 2. Unused files details
console.log('Unused files total size:', (data.unusedCodeFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2), 'MB');
console.log('Unused files count:', data.unusedCodeFiles.length);

// 3. Count unused files by prefix
const unusedByPrefix = {};
data.unusedCodeFiles.forEach(f => {
  const prefix = f.path.split('/')[0];
  unusedByPrefix[prefix] = (unusedByPrefix[prefix] || 0) + f.size;
});

console.log('\nUnused size by prefix:');
Object.entries(unusedByPrefix).forEach(([prefix, size]) => {
  console.log(`- ${prefix}: ${(size / 1024).toFixed(1)} KB`);
});

// 4. Let's find files that are in the main package AND unused
const unusedMainFiles = data.unusedCodeFiles.filter(f => !f.subPackage);
console.log('\nUnused main package files count:', unusedMainFiles.length);
console.log('Unused main package files total size:', (unusedMainFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1), 'KB');

console.log('\nTop 20 largest unused main package files:');
unusedMainFiles.sort((a, b) => b.size - a.size).slice(0, 20).forEach(f => {
  console.log(`- ${f.path} (${(f.size / 1024).toFixed(1)} KB)`);
});
