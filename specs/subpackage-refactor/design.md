# Technical Solution Design: Subpackage Refactoring

## 1. Architecture Overview

The WeChat Mini Program `mini-ecom-open` will be restructured to strictly follow the "Main Package for Core Routing, Subpackages for Domain Logic" (主包管路由，分包管业务) architecture.

### 1.1 Package Definitions
- **Main Package**: Reserved exclusively for TabBar pages (`home`, `category`, `cart`, `usercenter`) and globally shared utilities/services (e.g., `utils/util.js`, `services/order/logistics.js`).
- **Domain Subpackages**:
  - `user`: Handles secondary user-center pages (address management, profile edit) and holds the large `areaData.js`.
  - `admin`: Handles merchant dashboard and operations.
  - `goods`: Handles product details, lists, and comments.
  - `order`: Handles order placement, tracking, and after-sales.

## 2. Directory Transformation Strategy

### 2.1 The `user` Subpackage Extraction
- Add `{ "root": "pages/user", "name": "user", "pages": [...] }` to `app.json` `subpackages`.
- Move `miniprogram/pages/usercenter/address` -> `miniprogram/pages/user/address`.
- Move `miniprogram/pages/usercenter/name-edit` -> `miniprogram/pages/user/name-edit`.
- Move `miniprogram/pages/usercenter/person-info` -> `miniprogram/pages/user/person-info`.
- Move `miniprogram/utils/areaData.js` -> `miniprogram/pages/user/utils/areaData.js`.
- Move `miniprogram/services/address/` and `miniprogram/services/usercenter/` -> `miniprogram/pages/user/services/`.

### 2.2 Service Layer Descent (服务下沉)
To resolve the "unused files in main package" code quality error:
- Move `services/admin/*` -> `pages/admin/services/`.
- Move `services/comments/*` -> `pages/goods/services/comments/`.
- Extract subpackage-only files from `services/good/` (e.g., `fetchGood.js`) -> `pages/goods/services/`.
- Extract subpackage-only files from `services/order/` (e.g., `invoiceConstants.js`, `orderDetail.js`) -> `pages/order/services/`.

## 3. Dependency Path Rewriting
A systemic path rewrite is required. The technical approach involves:
1. Scanning all `.js` and `.json` files for relative `import` and `require` statements pointing to the old `services/` and `utils/areaData.js` locations.
2. Scanning all `.wxml` and `.js` files for `wx.navigateTo` or `navigator` components pointing to the old `/pages/usercenter/address/*` etc.
3. Updating the paths accurately based on their new relative depth.

## 4. Test Strategy
- Validate compilation success in WeChat Developer Tools.
- Ensure the bundle size of the Main Package strictly drops by at least 500KB.
- Ensure no "Unused files" warnings remain in the Code Quality scan for the relocated files.
