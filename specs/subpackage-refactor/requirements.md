# Requirements Document: Subpackage Architecture Refactoring

## Introduction

The current `mini-ecom-open` WeChat Mini Program architecture has several issues related to the Main Package (主包) size and unused files warning:
1. The Main Package exceeds necessary bounds by including files (e.g., `services/order/*.js`, `services/admin/*.js`) that are strictly isolated to specific subpackages (`order`, `admin`, `goods`). This triggers the Code Quality warning: "主包内存在无使用或无依赖文件".
2. The Main Package includes secondary user center pages (e.g., Address Edit, Name Edit) and a very large dependency (`utils/areaData.js` ~450KB) which heavily inflates the initial download size of the Mini Program.

This refactoring requirement aims to extract these secondary pages and subpackage-specific services into their respective subpackage boundaries to achieve optimal Main Package slimming (主包瘦身) and eliminate code quality warnings.

## Requirements

### Requirement 1 - User Subpackage Extraction

**User Story:** As an end-user, when I launch the mini-program, I want it to load as fast as possible without downloading heavy static data (like nationwide region data) until I actually need to edit my address.

#### Acceptance Criteria

1. While the application is launched, when the user is on the Main Package pages (Home, Category, Cart, UserCenter Tab), the system shall NOT download `utils/areaData.js` or the secondary user center pages.
2. While navigating to address management, when the user clicks "Edit Address", the system shall dynamically load the new `user` subpackage containing the address pages and `areaData.js`.

### Requirement 2 - Service Logic Subpackaging

**User Story:** As a developer, I want the project architecture to be clean so that services exclusive to a specific business domain (like `admin` or `order`) are stored entirely within their respective subpackages, passing the WeChat Developer Tools Code Quality scan without unused file warnings.

#### Acceptance Criteria

1. While compiling the code, when the WeChat Developer Tool scans for unused files in the Main Package, the system shall return a "Passed" status for the JavaScript unused files rule.
2. While maintaining the existing logic, when `admin`, `goods`, or `order` pages invoke their specific API services, the system shall correctly resolve the imports from their local subpackage `services/` directory instead of the Main Package.
