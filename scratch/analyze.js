const fs = require('fs');
const path = require('path');

const dataPath = '/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json';
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

console.log('Total files in scan:', data.files ? data.files.length : 0);

// Let's inspect the keys of the JSON to see what properties it has
console.log('Top-level keys:', Object.keys(data));

// Let's filter files in main package (subPackage === null or subPackage === 'main')
if (data.files) {
  const mainPkgFiles = data.files.filter(f => !f.subPackage);
  console.log('\nMain Package total size (unpacked/scanned):', (mainPkgFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2), 'MB');
  console.log('Number of files in main package:', mainPkgFiles.length);

  // Top 20 largest files in main package
  console.log('\nTop 20 largest files in main package:');
  mainPkgFiles.sort((a, b) => b.size - a.size).slice(0, 20).forEach(f => {
    console.log(`- ${f.path} (${(f.size / 1024).toFixed(1)} KB)`);
  });

  // Filter media files (images, audio)
  const mediaExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp3', '.wav'];
  const mediaFiles = data.files.filter(f => mediaExtensions.includes(f.ext.toLowerCase()));
  console.log('\nMedia files count:', mediaFiles.length);
  console.log('Total media files size:', (mediaFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1), 'KB');
  console.log('Top 15 largest media files:');
  mediaFiles.sort((a, b) => b.size - a.size).slice(0, 15).forEach(f => {
    console.log(`- ${f.path} (${(f.size / 1024).toFixed(1)} KB) [subPackage: ${f.subPackage}]`);
  });
}

// Check other keys like unused files if any
for (const key of Object.keys(data)) {
  if (key !== 'files') {
    console.log(`\nKey: ${key}`);
    const val = data[key];
    if (Array.isArray(val)) {
      console.log(`Array length: ${val.length}`);
      console.log('First 5 items:', val.slice(0, 5));
    } else {
      console.log('Value type:', typeof val);
    }
  }
}
