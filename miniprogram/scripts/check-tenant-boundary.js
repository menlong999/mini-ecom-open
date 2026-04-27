const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const textExtensions = new Set(['.js', '.json', '.md', '.sh', '.wxml', '.wxss', '.yaml', '.yml']);

const skipPaths = new Set([
  'miniprogram/scripts/check-tenant-boundary.js',
  'miniprogram/scripts/check-style-boundary.js',
]);
const skipPrefixes = ['rules/', 'miniprogram/package-lock.json'];

const bannedPatterns = [
  { name: 'real WeChat appid', pattern: /wx[0-9a-f]{16,}/i },
  { name: 'real CloudBase env id', pattern: /cloud\d+-[0-9a-z][0-9a-z-]{8,}/i },
  { name: 'CloudBase payment workflow id', pattern: /sywxzf[0-9a-z_]{8,}/i },
  { name: 'legacy we-retail asset host', pattern: /we-retail-static/i },
  { name: 'legacy external loading asset host', pattern: /cdn\.ghsmpwalmart\.com/i },
  { name: 'TDesign retail template asset', pattern: /tdesign\.gtimg\.com\/miniprogram\/template/i },
  { name: 'hard-coded WeChat avatar url', pattern: /wx\.qlogo\.cn\/mmopen\/vi_32\/[^'"\s]+\/132/i },
];

function listTrackedFiles() {
  return childProcess
    .execFileSync('git', ['ls-files', '-z'], { cwd: repoRoot })
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

function shouldScan(file) {
  if (skipPaths.has(file)) return false;
  if (skipPrefixes.some((prefix) => file.startsWith(prefix))) return false;
  return textExtensions.has(path.extname(file));
}

const violations = [];

for (const file of listTrackedFiles()) {
  if (!shouldScan(file)) continue;

  const fullPath = path.join(repoRoot, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    bannedPatterns.forEach(({ name, pattern }) => {
      if (pattern.test(line)) {
        violations.push(`${file}:${index + 1}: ${name}`);
      }
    });
  });
}

if (violations.length > 0) {
  console.error('[check-tenant-boundary] tenant/private boundary violations found:');
  violations.forEach((item) => console.error(`  ${item}`));
  process.exit(1);
}

console.log('[check-tenant-boundary] ok: no tenant/private leakage found');
