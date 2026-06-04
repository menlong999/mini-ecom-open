# Implementation Plan: Homepage Configuration Goods Picker Fix

- [x] 1. Update `searchGoods` in `home-config/index.js`
  - Merge the fetched product search list (`res.list`) into `goodsMap` during `searchGoods()`.
  - Ensure existing map items are preserved.
  - _Requirement: 1_

- [x] 2. Verify display behavior
  - Verify that checking a product in the search results correctly displays its name instead of ID in the selected goods list at the top.
  - _Requirement: 1_
