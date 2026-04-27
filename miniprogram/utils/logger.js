/**
 * 轻量日志封装 —— 渐进式替换裸 console.* 调用。
 *
 * 目标：
 * 1. 生产环境只输出 warn/error；开发态可看到 debug/info/log。
 * 2. 给二开者一个统一的注入点（接监控、上报、打 tag 等）。
 *
 * 用法：
 *   const logger = require('../utils/logger');
 *   logger.debug('cart.add', { skuId });
 *   logger.warn('cart.invalidStock', err);
 *
 * 控制开发态：
 *   修改 tenant.config.js 中的 `runtime.debug` 字段（默认 false），
 *   或在小程序运行时执行：getApp().__debug = true。
 */

function isDebug() {
  try {
    if (typeof getApp === 'function') {
      const app = getApp();
      if (app && (app.__debug === true || (app.globalData && app.globalData.__debug === true))) {
        return true;
      }
    }
  } catch (e) {
    // ignore
  }
  return false;
}

function pass(level, args) {
  // warn/error 始终输出；其余仅 debug 模式输出
  if (level === 'warn' || level === 'error') return true;
  return isDebug();
}

function make(level) {
  return function () {
    if (!pass(level, arguments)) return;
    // eslint-disable-next-line no-console
    const fn = console[level] || console.log;
    fn.apply(console, arguments);
  };
}

module.exports = {
  debug: make('debug'),
  info: make('info'),
  log: make('log'),
  warn: make('warn'),
  error: make('error'),
};
