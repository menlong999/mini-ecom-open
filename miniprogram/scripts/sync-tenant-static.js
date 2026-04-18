const fs = require('fs');
const path = require('path');

const miniprogramRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(miniprogramRoot, '..');
const defaultTenantConfig = require(path.join(repoRoot, 'tenants', 'default', 'tenant.config.js'));
const tenantName = process.argv[2];

if (!tenantName) {
  console.error('[sync-tenant-static] missing tenant name, usage: npm run sync:tenant -- <tenant>');
  process.exit(1);
}

const tenantConfigPath = path.join(repoRoot, 'tenants', tenantName, 'tenant.config.js');
if (!fs.existsSync(tenantConfigPath)) {
  console.error(`[sync-tenant-static] tenant config not found: ${tenantConfigPath}`);
  process.exit(1);
}

const tenantOverrideConfig = require(tenantConfigPath);

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  const result = { ...base };
  Object.keys(override || {}).forEach((key) => {
    const baseValue = result[key];
    const overrideValue = override[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
      return;
    }
    result[key] = overrideValue;
  });
  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeModule(filePath, value) {
  fs.writeFileSync(filePath, `module.exports = ${JSON.stringify(value, null, 2)};\n`);
}

function pickRuntimeConfig(value) {
  return {
    app: value.app,
    cloud: value.cloud,
    wechat: value.wechat,
    assets: value.assets,
    afterService: value.afterService,
    customerService: value.customerService,
    features: value.features,
    logistics: value.logistics,
    order: value.order,
  };
}

const runtimeConfig = deepMerge(defaultTenantConfig, tenantOverrideConfig);

const appTemplatePath = path.join(miniprogramRoot, 'app.template.json');
const appOutputPath = path.join(miniprogramRoot, 'app.json');
const sitemapTemplatePath = path.join(miniprogramRoot, 'sitemap.template.json');
const sitemapOutputPath = path.join(miniprogramRoot, 'sitemap.json');
const runtimeConfigOutputPath = path.join(miniprogramRoot, 'config', 'runtime.js');
const legacyRuntimeConfigPath = path.join(miniprogramRoot, 'config', 'private.js');
const projectTemplatePath = path.join(repoRoot, 'project.config.template.json');
const projectOutputPath = path.join(repoRoot, 'project.config.json');
const unifiedOrderPrivateConfigPath = path.join(
  repoRoot,
  'cloudfunctions',
  'unifiedOrder',
  'config.private.js'
);
const afterServicePrivateConfigPath = path.join(
  repoRoot,
  'cloudfunctions',
  'adminManageAfterService',
  'config.private.js'
);
const generateQrPrivateConfigPath = path.join(
  repoRoot,
  'cloudfunctions',
  'generateQRCode',
  'config.private.js'
);
const createOrderPrivateConfigPath = path.join(
  repoRoot,
  'cloudfunctions',
  'createOrder',
  'config.private.js'
);

const appConfig = readJson(appTemplatePath);
const sitemapConfig = readJson(sitemapTemplatePath);
const projectConfig = readJson(projectTemplatePath);

const appName = runtimeConfig.app && runtimeConfig.app.name;
const permissionDesc = runtimeConfig.app && runtimeConfig.app.permissionDesc;
const appDescription = (runtimeConfig.app && runtimeConfig.app.description) || appName;
const wechatAppId = runtimeConfig.wechat && runtimeConfig.wechat.appId;
const wechatProjectName =
  (runtimeConfig.wechat && runtimeConfig.wechat.projectName) || appName || 'retail-oss';
const wechatProjectDescription =
  (runtimeConfig.wechat && runtimeConfig.wechat.projectDescription) || appDescription;

if (appName) {
  appConfig.window = appConfig.window || {};
  appConfig.window.navigationBarTitleText = appName;
}

if (permissionDesc) {
  appConfig.permission = appConfig.permission || {};
  appConfig.permission['scope.userLocation'] = appConfig.permission['scope.userLocation'] || {};
  appConfig.permission['scope.userLocation'].desc = permissionDesc;
}

if (appDescription) {
  sitemapConfig.desc = appDescription;
}

if (wechatAppId) {
  projectConfig.appid = wechatAppId;
}

if (wechatProjectName) {
  projectConfig.projectname = wechatProjectName;
}

if (wechatProjectDescription) {
  projectConfig.description = wechatProjectDescription;
}

writeJson(appOutputPath, appConfig);
writeJson(sitemapOutputPath, sitemapConfig);
writeJson(projectOutputPath, projectConfig);
writeModule(runtimeConfigOutputPath, pickRuntimeConfig(runtimeConfig));
writeModule(unifiedOrderPrivateConfigPath, {
  payment: {
    workflowName: (runtimeConfig.payment && runtimeConfig.payment.workflowName) || '',
  },
});
writeModule(afterServicePrivateConfigPath, {
  payment: {
    refundWorkflowName: (runtimeConfig.payment && runtimeConfig.payment.refundWorkflowName) || '',
  },
});
writeModule(generateQrPrivateConfigPath, {
  qrcode: runtimeConfig.qrcode || {},
});
writeModule(createOrderPrivateConfigPath, {
  order: runtimeConfig.order || {},
});
if (fs.existsSync(legacyRuntimeConfigPath)) {
  fs.unlinkSync(legacyRuntimeConfigPath);
}

console.log(
  `[sync-tenant-static] synced runtime files for tenant: ${tenantName} (${appName || 'default'})`
);
