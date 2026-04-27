const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEXT_EXTENSIONS = new Set(['.js', '.json', '.wxml', '.wxss']);
const SKIP_DIRS = new Set(['node_modules', 'miniprogram_npm']);
const SKIP_FILES = new Set([
  'config/private.js',
  'config/runtime.js',
  'scripts/check-style-boundary.js',
  'scripts/check-tenant-boundary.js',
]);

const bannedPatterns = [
  { name: 'legacy retail red', pattern: /#fa4126/i },
  { name: 'legacy retail orange', pattern: /#fa550f/i },
  { name: 'legacy tab orange', pattern: /#ff5f15/i },
  { name: 'legacy admin blue', pattern: /#0052d9/i },
  { name: 'legacy category blue', pattern: /#0071ce/i },
  { name: 'legacy address blue', pattern: /#0091ff/i },
  { name: 'legacy address purple', pattern: /#5a66ff/i },
  { name: 'legacy address purple bg', pattern: /#f0f1ff/i },
  { name: 'legacy admin blue tint', pattern: /#e6eefb/i },
  { name: 'legacy notice orange text', pattern: /#e17349/i },
  { name: 'legacy notice cream bg', pattern: /#fefcef/i },
  { name: 'legacy after-service orange', pattern: /#d05b27/i },
  { name: 'legacy bright green switch', pattern: /#0abf5b/i },
  { name: 'legacy delivery red', pattern: /#ef5433/i },
  { name: 'legacy stock danger red', pattern: /#e34d59/i },
  { name: 'legacy address purple rgba', pattern: /rgba\(\s*122\s*,\s*167\s*,\s*251/i },
  { name: 'legacy gray rgb(116)', pattern: /rgb\(\s*116\s*,\s*116\s*,\s*116/i },
  { name: 'TDesign retail template asset', pattern: /tdesign\.gtimg\.com\/miniprogram\/template/i },
  { name: 'legacy retail static asset', pattern: /we-retail-static/i },
  { name: 'legacy external loading asset', pattern: /cdn\.ghsmpwalmart\.com/i },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const violations = [];

for (const file of walk(ROOT)) {
  const relPath = path.relative(ROOT, file);
  if (SKIP_FILES.has(relPath)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    bannedPatterns.forEach(({ name, pattern }) => {
      if (pattern.test(line)) {
        violations.push(`${relPath}:${index + 1}: ${name}`);
      }
    });
  });
}

if (violations.length > 0) {
  console.error('[check-style-boundary] legacy visual style found:');
  violations.forEach((item) => console.error(`  ${item}`));
  process.exit(1);
}

console.log('[check-style-boundary] ok: no legacy retail template style found');
