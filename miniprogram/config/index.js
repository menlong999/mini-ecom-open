let runtimeConfig = {};
try {
  const loaded = require('./runtime.js');
  runtimeConfig = loaded.default || loaded;
} catch (error) {
  throw new Error(
    'Missing generated runtime config. Run `npm run sync:tenant -- <tenant>` in `miniprogram/` first.'
  );
}

export { runtimeConfig };

export const config = {
  /** 是否使用mock代替api返回 */
  useMock: false,
};

export const cdnBase = runtimeConfig.assets.cdnBase;
