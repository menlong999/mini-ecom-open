const fs = require('fs');
const path = require('path');

const miniprogramDir = '/Users/lvyuanfang/WeChatProjects/mini-ecom-open/miniprogram';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== 'miniprogram_npm' && f !== 'assets' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

const importPatterns = [
  /from\s+['"]([^'"]*services\/address\/[^'"]*)['"]/g,
  /from\s+['"]([^'"]*services\/admin\/[^'"]*)['"]/g,
  /from\s+['"]([^'"]*services\/comments\/[^'"]*)['"]/g,
  /from\s+['"]([^'"]*services\/good\/[^'"]*)['"]/g,
  /from\s+['"]([^'"]*services\/order\/[^'"]*)['"]/g,
  /from\s+['"]([^'"]*services\/usercenter\/[^'"]*)['"]/g,
  /from\s+['"]([^'"]*utils\/areaData[^'"]*)['"]/g
];

console.log('Searching for imports of deleted service/util files...');

walkDir(miniprogramDir, (filePath) => {
  if (filePath.endsWith('.js')) {
    const content = fs.readFileSync(filePath, 'utf8');
    let hasMatch = false;
    const matches = [];

    importPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        hasMatch = true;
        matches.push(match[0]);
      }
    });

    if (hasMatch) {
      console.log(`\nFile: ${path.relative(miniprogramDir, filePath)}`);
      matches.forEach(m => console.log(`  Match: ${m}`));
    }
  }
});
