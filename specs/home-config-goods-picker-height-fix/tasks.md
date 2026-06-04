# Implementation Plan: Homepage Configuration Goods Picker Height Fix

- [x] 1. Enforce Fixed Height on Picker Popup
  - Update `.picker` CSS class in `miniprogram/pages/admin/home-config/index.wxss` to use `height: 75vh` instead of `max-height: 80vh` to prevent flex height collapse.
  - _Requirement: 1_

- [x] 2. Correct primitive array keying in WXML template
  - Update `wx:key` in `movable-view` for `tabEditingSpuIds` to `*this` in `miniprogram/pages/admin/home-config/index.wxml`.
  - _Requirement: 1_
