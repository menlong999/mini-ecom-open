const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/lvyuanfang/WeChatProjects/mini-ecom-open/analyse-data.json', 'utf8'));

// Find modules representing the pages
const pageModuleId = 'Page:pages/user/address/edit/index.json';
const pageModule = data.modules.find(m => m.id === pageModuleId);

if (pageModule) {
  console.log('Found page module:', pageModuleId);
  console.log('Dependencies (deps):', JSON.stringify(pageModule.deps, null, 2));
  console.log('Parent Dependencies (parentDeps):', JSON.stringify(pageModule.parentDeps, null, 2));
} else {
  console.log('Page module not found in modules list!');
}

// Let's also look for JS module dependencies
const jsModuleId = 'Js:pages/user/address/edit/index.js';
const jsModule = data.modules.find(m => m.id === jsModuleId);
if (jsModule) {
  console.log('\nFound JS module:', jsModuleId);
  console.log('Dependencies (deps):', JSON.stringify(jsModule.deps, null, 2));
} else {
  console.log('\nJS module not found in modules list!');
}

// Let's search for areaData module
const areaDataModule = data.modules.find(m => m.path && m.path.includes('areaData'));
if (areaDataModule) {
  console.log('\nFound areaData module:', JSON.stringify(areaDataModule, null, 2));
} else {
  console.log('\nareaData module not found in modules list!');
}
