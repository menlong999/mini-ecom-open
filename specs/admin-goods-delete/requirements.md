# Requirements Document: Admin Product Deletion and Reference Dissociation

## Introduction

In the administrator panel, there was no user interface or button provided to delete a product. However, database deletion and cleanup logic are needed to manage catalog size, remove obsolete products, and maintain clean database references. This document defines the requirements for deleting products in the admin panel and managing the references across related collections.

## Requirements

### Requirement 1 - Single Product Deletion Button in Edit Page

**User Story:** As an administrator editing a product, I want to see a "Delete Product" button so that I can remove obsolete items from the catalog.

#### Acceptance Criteria
1. The "Delete Product" button shall only be visible when editing an existing product (i.e. when `id` is present). It shall not show up when creating a new product.
2. The button shall be styled with a warning/danger theme (red outline/text).
3. Clicking the button shall trigger a secondary confirmation dialog (`wx.showModal`).
4. On confirmation, the system shall execute deletion and show a success toast, then navigate back and refresh the list.

### Requirement 2 - Database Cascading Deletion for Specs and SKUs

When a product (SPU) is deleted, all associated specifications (`goods_spec`) and specifications combinations (`goods_sku`) belonging to that SPU must be permanently deleted.

### Requirement 3 - Dissociation of Home Configuration References

When a product (SPU) is deleted, any references to its SPU ID inside the home configuration (`home_config` collection) must be cleaned up:
1. Removed from the swiper banner list (`swiper` array).
2. Removed from any recommendation tab lists (`tabList[].spuIds` array).

### Requirement 4 - Cloud Storage Media Resource Cleanup

To prevent cloud storage space leaks, any images or videos associated with the SPU and its SKUs (stored with `cloud://` scheme) must be deleted from cloud storage when the SPU is deleted:
1. SPU primary image (`primaryImage`).
2. SPU carousel images (`images`).
3. SPU details images/videos (`desc`).
4. SKU custom images (`skuList[].image`).
