# Requirements Document: Homepage Configuration Goods Picker Fix

## Introduction

In the admin interface, when configuring the home page tabs and selecting goods via the product picker modal, newly selected goods showed their database `_id` instead of their `title`. This requirements document defines the behavior to ensure the human-readable product title is displayed to the administrator immediately upon selection.

## Requirements

### Requirement 1 - Display Product Title in Selector List

**User Story:** As an administrator configuring the home page tabs, I want to see the titles of the goods I select in the picker modal so that I can easily verify and organize my selection.

#### Acceptance Criteria

1. When a product is selected/checked in the product search result list within the picker modal, the selected items list at the top of the modal shall immediately display the product's title.
2. While the picker modal is open, the system shall not fall back to displaying the product's raw database ID for newly selected items.
