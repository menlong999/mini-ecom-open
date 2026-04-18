/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// In CI we don't need Git hooks and the checkout context can vary.
if (process.env.CI || process.env.HUSKY === '0') {
  process.exit(0);
}

// This package lives under `miniprogram/`, but `.git` and `.husky` are in repo root.
const repoRoot = path.resolve(__dirname, '..', '..');
const gitDir = path.join(repoRoot, '.git');
const huskyDir = path.join(repoRoot, '.husky');
const huskyBin = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'husky.cmd' : 'husky'
);

if (!fs.existsSync(gitDir) || !fs.existsSync(huskyDir) || !fs.existsSync(huskyBin)) {
  process.exit(0);
}

try {
  execFileSync(huskyBin, ['install'], { cwd: repoRoot, stdio: 'inherit' });
} catch (err) {
  // Don't block installs if hooks can't be installed (e.g. restricted environments).
  console.warn('[husky] install skipped:', err && err.message ? err.message : err);
}
