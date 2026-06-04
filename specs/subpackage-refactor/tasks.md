# Implementation Plan: Subpackage Refactoring

- [x] 1. Update `app.json` Configuration
  - Add the `user` subpackage to the `subpackages` array.
  - Remove the secondary user center pages from the Main Package `pages` array.
  - _Requirement: 1_

- [x] 2. Migrate User Subpackage Files
  - Move address, person-info, and name-edit page directories to `pages/user/`.
  - Move `areaData.js` to `pages/user/utils/`.
  - Move user and address services to `pages/user/services/`.
  - Update all `import` paths and `wx.navigateTo` routes associated with these files.
  - _Requirement: 1_

- [x] 3. Refactor Admin Services
  - Move `services/admin/` to `pages/admin/services/`.
  - Update all relative import paths in the `admin` pages.
  - _Requirement: 2_

- [x] 4. Refactor Goods Services
  - Move `services/comments/` to `pages/goods/services/comments/`.
  - Move specific `services/good/` files (`fetchGood.js`, `fetchGoodsDetailsComments.js`, `fetchGoodsList.js`) to `pages/goods/services/`.
  - Update relative import paths in the `goods` pages.
  - _Requirement: 2_

- [x] 5. Refactor Order Services
  - Move `afterService.js`, `applyService.js`, `invoiceConstants.js`, `orderDetail.js`, `orderList.js`, `payment.js`, `createOrder.js` from `services/order/` to `pages/order/services/`.
  - Update relative import paths in the `order` pages.
  - _Requirement: 2_
