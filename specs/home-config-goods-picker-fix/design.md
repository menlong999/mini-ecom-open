# Technical Solution Design: Homepage Configuration Goods Picker Fix

## Technical Architecture & Solution

### Root Cause
1. The product selection modal renders selected goods in the top list (`tabEditingSpuIds`) using `goodsMap[spuId].title` for formatting.
2. In the original implementation, `goodsMap` was only updated when `refreshGoodsMap()` was called. `refreshGoodsMap()` only queries the IDs present in the saved/existing `swiperList` and `tabList` on the page.
3. When a user checked a new product in the search list, its ID was added to `tabEditingSpuIds` but not to `tabList` (until "Confirm" is clicked). Consequently, `refreshGoodsMap()` did not fetch this new ID's details, causing `goodsMap[spuId]` to be undefined and fallback to showing the ID.

### Proposed Solution
Instead of making additional backend roundtrips to fetch details of newly selected items, we merge the search results from the search endpoint directly into the local `goodsMap` memory space when the search completes.

1. Update the `searchGoods()` method in `miniprogram/pages/admin/home-config/index.js`.
2. Extract the search results list (`res.list`).
3. Clone the existing `goodsMap` object from `this.data.goodsMap`.
4. Iterate through `res.list` and insert the `{ title, primaryImage, minSalePrice }` values for each item into the cloned map under `item._id`.
5. Write the updated map back to `this.setData({ goodsMap })` alongside `goodsSearchList`.

This ensures that any product displayed in the search result list will immediately have its name and details loaded in `goodsMap` when selected, resolving the ID display bug.
