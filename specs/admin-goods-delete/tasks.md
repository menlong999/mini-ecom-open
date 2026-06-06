# Implementation Plan: Admin Product Deletion and Reference Dissociation

- [x] 1. Fix transaction bulk-remove limitation in `updateGoods` and `deleteGoods` in `cloudfunctions/adminManageGoods/index.js`
  - _Requirement: 2_

- [x] 2. Implement `cleanHomeConfigReferences` helper in `cloudfunctions/adminManageGoods/index.js` to dissociate homepage references
  - _Requirement: 3_

- [x] 3. Implement `deleteGoodsMediaFiles` helper in `cloudfunctions/adminManageGoods/index.js` to delete cloud storage images/videos
  - _Requirement: 4_

- [x] 4. Add "删除商品" button and styles to the admin goods edit page (`edit/index.wxml`, `edit/index.wxss`)
  - _Requirement: 1_

- [x] 5. Implement `onDeleteGoods()` and link it to the backend `deleteGoods` service in `edit/index.js`
  - _Requirement: 1_

- [x] 6. Deploy the updated `adminManageGoods` cloud function and verify the full deletion and update logic
  - _Requirement: 1, 2, 3, 4_
