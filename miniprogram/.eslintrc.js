module.exports = {
  root: true,
  ignorePatterns: ['config/runtime.js', 'utils/wxCloudClientSDK.umd.js', 'miniprogram_npm/**'],
  env: {
    es6: true,
    browser: true,
    node: true,
    commonjs: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  globals: {
    App: true,
    Page: true,
    Component: true,
    Behavior: true,
    wx: true,
    getApp: true,
    getCurrentPages: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    // 渐进收敛：禁止裸 console.log/info/debug，建议改用 utils/logger。
    // warn/error 仍允许，便于线上诊断；warning 级别不阻断 CI。
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'prefer-const': 'warn',
  },
};
