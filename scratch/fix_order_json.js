const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../docs/schemas/json/order.json');
let content = fs.readFileSync(file, 'utf8');

const fieldsToChange = [
  'couponAmount',
  'deliveryFee',
  'totalSalePrice',
  'totalPayAmount',
  'promotionAmount'
];

fieldsToChange.forEach(field => {
  // Find the block for this field and change its type from "string" to "number"
  const regex = new RegExp(`"name":\\s*"${field}"[\\s\\S]*?"type":\\s*"string"`, 'g');
  content = content.replace(regex, match => match.replace('"type": "string"', '"type": "number"'));
});

fs.writeFileSync(file, content);
console.log('Fixed order.json');
