# Technical Solution Design: Admin Product Deletion and Reference Dissociation

## Technical Architecture & Solution

### Backend: Cloud Function `adminManageGoods`

#### 1. Fix Transaction Limitations
WeChat Cloudbase database transactions do not support bulk writes/deletions like `.where().remove()`. 
- **Solution**: We query the IDs of target specs and SKUs first inside the transaction, and then iterate through the results to delete each document individually using `.doc(id).remove()`. This is implemented in both `deleteGoods` and `updateGoods` to ensure product updates/deletes do not crash the transaction.

#### 2. Home Configuration References Cleanup
Implemented `cleanHomeConfigReferences(spuId)`:
- Fetch all documents in the `home_config` collection.
- Check and filter out the deleted `spuId` from `swiper` items and `tabList[].spuIds` arrays.
- Save the modified document back to the database if references were found and removed.

#### 3. Cloud Storage Files Cleanup
Implemented `deleteGoodsMediaFiles(spuData, skuList)`:
- Accumulate all unique `cloud://` URLs from SPU `primaryImage`, `images`, `desc` details, and custom SKU images.
- Deduplicate the list.
- Call `cloud.deleteFile` in chunks of 50 (the max limit of WeChat Cloud Storage API) to release storage space.

---

### Frontend: Goods Edit Page

#### 1. Page Template (`edit/index.wxml`)
- Check for product `id`. If editing an existing product, add a dual-button container `.footer-btn--dual` rendering "删除商品" (`t-button` with `theme="danger"` and `variant="outline"`) next to "保存商品".

#### 2. Page Styling (`edit/index.wxss`)
- Style the dual-button layout using Flexbox, setting gap to `16rpx` and giving the "Save" button twice the flex share (`flex: 2`) compared to the "Delete" button (`flex: 1`).

#### 3. Page Controller (`edit/index.js`)
- Import `deleteGoods` from the `services/goodsMgr` layer.
- Implement `onDeleteGoods()` using `wx.showModal` to show a confirmation dialog.
- Upon user confirmation, trigger loading, call `deleteGoods(id)`, display success Toast, mark the list page for refresh via `markPrevPageRefresh()`, and navigate back.
