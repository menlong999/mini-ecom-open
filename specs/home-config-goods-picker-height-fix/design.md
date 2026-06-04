# Technical Solution Design: Homepage Configuration Goods Picker Height Fix

## Technical Architecture & Solution

### Root Cause
1. The `.picker-body` element (the scrollable content area) had style rule `flex: 1; height: 0; min-height: 0; overflow: hidden;`.
2. The parent container `.picker` had style rule `max-height: 80vh; display: flex; flex-direction: column;`.
3. In CSS flexbox, when a parent flex container height is set to `auto` (or only constrained by `max-height`), the browser engine determines the container height by summing up its children's heights first. Because `.picker-body` has `height: 0`, it contributes `0px` to the parent height. The parent container then shrinks to fit the other children (header + footer), and `.picker-body` receives `0px` layout height from the flex engine.
4. On some real device WebViews (unlike the WeChat DevTools simulator), this layout calculation collapses the scroll-view to `0px` height, making the selected products and search results completely invisible.
5. In addition, the loop key `wx:key="spuId"` was used on a primitive string array, causing potential rendering bugs.

### Proposed Solution
1. In `miniprogram/pages/admin/home-config/index.wxss`, change `.picker` from `max-height: 80vh;` to `height: 75vh;`. This enforces a fixed height on the parent flex container, allowing the flex engine to correctly calculate the remaining space for `.picker-body` (`75vh` minus header, search bar, and footer heights).
2. In `miniprogram/pages/admin/home-config/index.wxml`, update the loop key `wx:key="spuId"` in the `movable-view` element for `tabEditingSpuIds` to `wx:key="*this"`.
