const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaultTenantPath = path.join(repoRoot, 'tenants', 'default', 'tenant.config.js');
const tenantName = process.argv[2];

if (!tenantName) {
  console.error(
    '[validate-tenant-config] missing tenant name, usage: npm run tenant:validate -- <tenant>'
  );
  process.exit(1);
}

const allowedTopLevelKeys = new Set([
  'app',
  'cloud',
  'wechat',
  'assets',
  'afterService',
  'customerService',
  'features',
  'invoice',
  'logistics',
  'order',
  'payment',
  'qrcode',
]);

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

function fail(message) {
  console.error(`[validate-tenant-config] ${message}`);
  process.exit(1);
}

function assertObject(value, fieldPath) {
  if (!isPlainObject(value)) {
    fail(`${fieldPath} must be an object`);
  }
}

function assertString(value, fieldPath) {
  if (typeof value !== 'string') {
    fail(`${fieldPath} must be a string`);
  }
}

function assertBoolean(value, fieldPath) {
  if (typeof value !== 'boolean') {
    fail(`${fieldPath} must be a boolean`);
  }
}

function assertNumber(value, fieldPath) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    fail(`${fieldPath} must be a number`);
  }
}

function validateTopLevelKeys(config, label) {
  Object.keys(config || {}).forEach((key) => {
    if (!allowedTopLevelKeys.has(key)) {
      fail(`${label} contains unsupported top-level key: ${key}`);
    }
  });
}

function validateLogisticsCompanies(companies, label) {
  if (!Array.isArray(companies)) {
    fail(`${label} must be an array`);
  }
  companies.forEach((company, index) => {
    assertObject(company, `${label}[${index}]`);
    assertString(company.name, `${label}[${index}].name`);
    assertString(company.code, `${label}[${index}].code`);
    assertString(company.phone, `${label}[${index}].phone`);
  });
}

function validateStringList(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
  }
  value.forEach((item, index) => {
    assertString(item, `${label}[${index}]`);
  });
}

function validateReasonList(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
  }
  value.forEach((item, index) => {
    assertObject(item, `${label}[${index}]`);
    assertNumber(item.id, `${label}[${index}].id`);
    assertString(item.desc, `${label}[${index}].desc`);
  });
}

function validateTenantConfig(config, label) {
  assertObject(config, label);

  assertObject(config.app, `${label}.app`);
  assertString(config.app.name, `${label}.app.name`);
  assertString(config.app.description, `${label}.app.description`);
  assertString(config.app.permissionDesc, `${label}.app.permissionDesc`);

  assertObject(config.cloud, `${label}.cloud`);
  assertString(config.cloud.envId, `${label}.cloud.envId`);

  assertObject(config.wechat, `${label}.wechat`);
  assertString(config.wechat.appId, `${label}.wechat.appId`);
  assertString(config.wechat.projectName, `${label}.wechat.projectName`);
  assertString(config.wechat.projectDescription, `${label}.wechat.projectDescription`);

  assertObject(config.assets, `${label}.assets`);
  assertString(config.assets.cdnBase, `${label}.assets.cdnBase`);
  validateStringList(
    config.assets.defaultGoodsDescImages,
    `${label}.assets.defaultGoodsDescImages`
  );

  assertObject(config.afterService, `${label}.afterService`);
  assertObject(config.afterService.returnAddress, `${label}.afterService.returnAddress`);
  assertString(config.afterService.returnAddress.name, `${label}.afterService.returnAddress.name`);
  assertString(
    config.afterService.returnAddress.phone,
    `${label}.afterService.returnAddress.phone`
  );
  assertString(
    config.afterService.returnAddress.address,
    `${label}.afterService.returnAddress.address`
  );
  validateReasonList(config.afterService.reasonList, `${label}.afterService.reasonList`);

  assertObject(config.customerService, `${label}.customerService`);
  assertString(config.customerService.phone, `${label}.customerService.phone`);
  assertString(
    config.customerService.serviceTimeDuration,
    `${label}.customerService.serviceTimeDuration`
  );
  assertBoolean(config.customerService.showOnlineChat, `${label}.customerService.showOnlineChat`);

  assertObject(config.features, `${label}.features`);
  assertBoolean(config.features.distributor, `${label}.features.distributor`);
  assertBoolean(config.features.invoice, `${label}.features.invoice`);
  assertBoolean(config.features.pickup, `${label}.features.pickup`);

  assertObject(config.invoice, `${label}.invoice`);
  validateStringList(config.invoice.notice, `${label}.invoice.notice`);
  validateStringList(config.invoice.taxCodeNotice, `${label}.invoice.taxCodeNotice`);

  assertObject(config.logistics, `${label}.logistics`);
  validateLogisticsCompanies(config.logistics.companies, `${label}.logistics.companies`);

  assertObject(config.order, `${label}.order`);
  assertObject(config.order.shipping, `${label}.order.shipping`);
  assertNumber(config.order.shipping.defaultFee, `${label}.order.shipping.defaultFee`);
  assertNumber(
    config.order.shipping.freeShippingThreshold,
    `${label}.order.shipping.freeShippingThreshold`
  );

  assertObject(config.payment, `${label}.payment`);
  assertString(config.payment.workflowName, `${label}.payment.workflowName`);
  assertString(config.payment.refundWorkflowName, `${label}.payment.refundWorkflowName`);

  assertObject(config.qrcode, `${label}.qrcode`);
  assertString(config.qrcode.page, `${label}.qrcode.page`);
  assertBoolean(config.qrcode.checkPath, `${label}.qrcode.checkPath`);
  assertString(config.qrcode.envVersion, `${label}.qrcode.envVersion`);
  assertNumber(config.qrcode.width, `${label}.qrcode.width`);
  assertString(config.qrcode.cloudPathPrefix, `${label}.qrcode.cloudPathPrefix`);
}

if (!fs.existsSync(defaultTenantPath)) {
  fail(`default tenant config not found: ${defaultTenantPath}`);
}

const defaultTenantConfig = require(defaultTenantPath);
validateTopLevelKeys(defaultTenantConfig, 'tenants/default/tenant.config.js');

let targetConfig = defaultTenantConfig;
let targetLabel = 'tenants/default/tenant.config.js';

if (tenantName !== 'default') {
  const tenantPath = path.join(repoRoot, 'tenants', tenantName, 'tenant.config.js');
  if (!fs.existsSync(tenantPath)) {
    fail(`tenant config not found: ${tenantPath}`);
  }
  const tenantOverrideConfig = require(tenantPath);
  validateTopLevelKeys(tenantOverrideConfig, `tenants/${tenantName}/tenant.config.js`);
  targetConfig = deepMerge(defaultTenantConfig, tenantOverrideConfig);
  targetLabel = `tenants/${tenantName}/tenant.config.js (merged)`;
}

validateTenantConfig(targetConfig, targetLabel);
console.log(`[validate-tenant-config] ok: ${tenantName}`);
