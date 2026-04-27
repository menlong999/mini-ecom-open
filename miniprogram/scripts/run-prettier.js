const path = require('path');
const { execFileSync } = require('child_process');

const mode = process.argv[2];

if (mode !== '--check' && mode !== '--write') {
  console.error('[run-prettier] usage: node scripts/run-prettier.js --check|--write');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..', '..');
const prettierBin = require.resolve('prettier/bin-prettier.js');
const ignorePath = path.join(repoRoot, '.prettierignore');

const commonArgs = [prettierBin, mode, '--ignore-path', ignorePath];

const targets = [
  '.eslintrc.js',
  '.prettierrc',
  'app.js',
  'package.json',
  'config/**/*.js',
  'pages/**/*.js',
  'scripts/**/*.js',
  'services/**/*.js',
  'utils/**/*.js',
  '../README.md',
  '../DATA_MODELS.md',
  '../CONTRIBUTING.md',
  '../commitlint.config.js',
  '../cloudbaserc.json',
  '../project.config.template.json',
  '../docs/**/*.md',
  '../cloudbase/**/*.{json,md}',
  '../tenants/**/*.js',
  '../.github/**/*.yml',
  '../cloudfunctions/**/*.js',
];

execFileSync(process.execPath, [...commonArgs, ...targets], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
});
