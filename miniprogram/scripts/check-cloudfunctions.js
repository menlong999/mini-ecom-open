const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const cloudfunctionsDir = path.join(repoRoot, 'cloudfunctions');

const specialFunctions = new Set([
  'cancelOrderTimer',
  'confirmReceiptTimer',
  'createOrder',
  'generateQRCode',
  'getLogisticsTrack',
  'login',
  'paymentCallback',
  'refundCallback',
  'unifiedOrder',
]);

function isAllowed(name) {
  return name.startsWith('adminManage') || name.startsWith('manage') || specialFunctions.has(name);
}

function main() {
  const entries = fs
    .readdirSync(cloudfunctionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const invalid = entries.filter((name) => !isAllowed(name));

  if (!invalid.length) {
    console.log(
      `[check-cloudfunctions] ok: ${entries.length} cloudfunctions satisfy naming conventions`
    );
    return;
  }

  console.error('[check-cloudfunctions] invalid cloudfunction names found:');
  invalid.forEach((name) => {
    console.error(`- ${name}`);
  });
  console.error(
    '[check-cloudfunctions] expected prefixes: adminManage*, manage*; or one of the approved special functions'
  );
  process.exit(1);
}

main();
