const fs = require('fs');
const path = require('path');

const miniprogramDir = '/Users/lvyuanfang/WeChatProjects/mini-ecom-open/miniprogram';

// Map of deleted/moved files (keys are logical paths relative to miniprogram root)
const movedFiles = {
  'services/address/address': 'pages/user/services/address/address',
  'services/address/channel': 'pages/user/services/address/channel',
  'services/admin/afterServiceMgr': 'pages/admin/services/afterServiceMgr',
  'services/admin/categoryMgr': 'pages/admin/services/categoryMgr',
  'services/admin/categoryService': 'pages/admin/services/categoryService',
  'services/admin/distributorMgr': 'pages/admin/services/distributorMgr',
  'services/admin/goodsMgr': 'pages/admin/services/goodsMgr',
  'services/admin/homeConfigMgr': 'pages/admin/services/homeConfigMgr',
  'services/admin/orderMgr': 'pages/admin/services/orderMgr',
  'services/admin/reportMgr': 'pages/admin/services/reportMgr',
  'services/admin/stockMgr': 'pages/admin/services/stockMgr',
  'services/comments/createComment': 'pages/goods/services/comments/createComment',
  'services/comments/fetchComments': 'pages/goods/services/comments/fetchComments',
  'services/comments/fetchCommentsCount': 'pages/goods/services/comments/fetchCommentsCount',
  'services/good/fetchGood': 'pages/goods/services/fetchGood',
  'services/good/fetchGoodsDetailsComments': 'pages/goods/services/fetchGoodsDetailsComments',
  'services/good/fetchGoodsList': 'pages/goods/services/fetchGoodsList',
  'services/good/skuHelper': 'pages/goods/services/skuHelper',
  'services/order/afterService': 'pages/order/services/afterService',
  'services/order/applyService': 'pages/order/services/applyService',
  'services/order/createOrder': 'pages/order/services/createOrder',
  'services/order/invoiceConstants': 'pages/order/services/invoiceConstants',
  'services/order/orderDetail': 'pages/order/services/orderDetail',
  'services/order/orderList': 'pages/order/services/orderList',
  'services/order/payment': 'pages/order/services/payment',
  'services/usercenter/fetchUsercenter': 'pages/user/services/usercenter/fetchUsercenter',
  'services/usercenter/qrcode': 'pages/user/services/usercenter/qrcode',
  'utils/areaData': 'pages/user/utils/areaData'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== 'miniprogram_npm' && f !== 'assets' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log('Processing files and updating imports...');

walkDir(miniprogramDir, (filePath) => {
  if (filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileDir = path.dirname(filePath);
    let isModified = false;

    // Pattern to match import paths: from 'path' or from "path"
    const importRegex = /(from\s+['"])([^'"]+)(['"])/g;

    const newContent = content.replace(importRegex, (match, prefix, importPath, suffix) => {
      // 1. Resolve import path relative to the file's directory
      // e.g. if file is miniprogram/pages/admin/goods/list/index.js,
      // and importPath is ../../../../services/admin/goodsMgr
      // Resolved path is miniprogram/services/admin/goodsMgr
      let resolvedAbsPath;
      if (importPath.startsWith('.')) {
        resolvedAbsPath = path.resolve(fileDir, importPath);
      } else {
        // Absolute import (unlikely in standard miniprogram but let's check)
        resolvedAbsPath = path.resolve(miniprogramDir, importPath);
      }

      // Convert to a path relative to miniprogramDir
      const relativeToMiniprogram = path.relative(miniprogramDir, resolvedAbsPath);
      
      // Normalize path separating characters to forward slashes for mapping lookups
      const normalizedPath = relativeToMiniprogram.split(path.sep).join('/');

      // Check if this normalized path is in our moved files mapping
      if (movedFiles[normalizedPath]) {
        const newTargetNormalized = movedFiles[normalizedPath];
        // Calculate new absolute path
        const newTargetAbsPath = path.resolve(miniprogramDir, newTargetNormalized);
        
        // Calculate relative path from fileDir to newTargetAbsPath
        let newRelativePath = path.relative(fileDir, newTargetAbsPath);
        
        // Normalize slashes
        newRelativePath = newRelativePath.split(path.sep).join('/');
        
        // Make sure it starts with ./ or ../
        if (!newRelativePath.startsWith('.')) {
          newRelativePath = './' + newRelativePath;
        }

        console.log(`[FIX] File: ${path.relative(miniprogramDir, filePath)}`);
        console.log(`      Import: ${importPath} -> ${newRelativePath} (Target: ${normalizedPath} -> ${newTargetNormalized})`);
        
        isModified = true;
        return `${prefix}${newRelativePath}${suffix}`;
      }

      return match;
    });

    if (isModified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
});

console.log('Finished updating imports.');
