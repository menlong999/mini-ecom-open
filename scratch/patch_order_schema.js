const fs = require('fs');
const path = require('path');

const orderJsonPath = path.join(__dirname, '../docs/schemas/json/order.json');
const orderData = JSON.parse(fs.readFileSync(orderJsonPath, 'utf8'));

// find orderSummary
const orderSummary = orderData.properties.orderSummary;
if (orderSummary && orderSummary.list) {
  orderSummary.list.forEach(field => {
    if (['totalSalePrice', 'totalPayAmount', 'deliveryFee', 'promotionAmount', 'couponAmount'].includes(field.name)) {
      field.type = 'number';
      field.numberCount = 0; // integer
    }
  });
}

fs.writeFileSync(orderJsonPath, JSON.stringify(orderData, null, 4));
console.log('Successfully patched order.json');
