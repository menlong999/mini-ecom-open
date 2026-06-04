const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json', 'utf8'));

console.log('Unused files under pages/, services/, utils/ and scripts/:');
const targetDirs = ['pages/', 'services/', 'utils/', 'scripts/'];

const unusedInTargets = data.unusedCodeFiles.filter(f => {
  return targetDirs.some(dir => f.path.startsWith(dir));
});

console.log(`Total target unused files: ${unusedInTargets.length}`);
unusedInTargets.sort((a, b) => b.size - a.size).forEach(f => {
  console.log(`- ${f.path} (${f.size} bytes)`);
});
