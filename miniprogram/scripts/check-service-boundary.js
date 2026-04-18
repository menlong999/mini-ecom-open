const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(miniprogramRoot, 'pages');
const appFile = path.join(miniprogramRoot, 'app.js');

const pagePatterns = [
  { label: 'wx.cloud.callFunction', regex: /wx\.cloud\.callFunction\s*\(/ },
  { label: 'wx.cloud.database', regex: /wx\.cloud\.database\s*\(/ },
  { label: 'cloudModels direct access', regex: /\.cloudModels\./ },
];

const appPatterns = [
  { label: 'wx.cloud.callFunction', regex: /wx\.cloud\.callFunction\s*\(/ },
  { label: 'wx.cloud.database', regex: /wx\.cloud\.database\s*\(/ },
];

function walkJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJsFiles(fullPath));
      return;
    }
    if (entry.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  });

  return files;
}

function collectViolations(filePath, patterns) {
  const content = fs.readFileSync(filePath, 'utf8');
  return patterns
    .filter(({ regex }) => regex.test(content))
    .map(({ label }) => ({
      filePath,
      label,
    }));
}

function toRelative(filePath) {
  return path.relative(miniprogramRoot, filePath);
}

function main() {
  const pageFiles = walkJsFiles(pagesDir);
  const violations = [
    ...collectViolations(appFile, appPatterns),
    ...pageFiles.flatMap((filePath) => collectViolations(filePath, pagePatterns)),
  ];

  if (!violations.length) {
    console.log(
      '[check-service-boundary] ok: app/pages do not directly access CloudBase read/write APIs'
    );
    return;
  }

  console.error('[check-service-boundary] forbidden direct CloudBase access found:');
  violations.forEach(({ filePath, label }) => {
    console.error(`- ${toRelative(filePath)}: ${label}`);
  });
  console.error(
    '[check-service-boundary] move CloudBase reads/writes and cloud function calls into miniprogram/services first'
  );
  process.exit(1);
}

main();
