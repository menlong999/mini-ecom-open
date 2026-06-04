# Requirements Document: Homepage Configuration Goods Picker Height Fix

## Introduction

In the admin interface, when configuring the home page tabs and clicking the "已选商品" dropdown button to open the product picker popup, the scrollable list of selected items and search results was completely invisible on real devices (while it worked fine on the simulator). This requirements document defines the behavior to ensure the selected items list and search results are fully visible and scrollable in all environments, including real devices.

## Requirements

### Requirement 1 - Visible and Scrollable Product Lists in Picker Popup

**User Story:** As an administrator, when I open the product picker popup on a real device, I want to see the selected products list and search results so that I can manage my home page tab configuration.

#### Acceptance Criteria

1. While the product picker popup is open, the scrollable body containing "已选商品" and "搜索结果" shall have a height greater than 0 and be fully visible on real devices.
2. The list within the popup shall be scrollable if the content height exceeds the available vertical space in the popup.
