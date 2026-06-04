/**
 * 地址相关的跨页面通信通道
 *
 * addressPicker - 订单确认页选择地址场景
 * addressEditor - 地址列表页等待编辑完成场景
 */

// ========== 地址选择通道 ==========
// 场景：订单确认页 → 地址列表页 → 选中地址后返回
let pickerPromise = [];

export const addressPicker = {
  /** 获取地址选择 Promise */
  getPromise: () => {
    let resolver;
    let rejecter;
    const nextPromise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    pickerPromise.push({ resolver, rejecter });
    return nextPromise;
  },

  /** 用户选择了一个地址 */
  resolve: (address) => {
    const allPromise = [...pickerPromise];
    pickerPromise = [];
    allPromise.forEach(({ resolver }) => resolver(address));
  },

  /** 用户没有选择任何地址 */
  reject: () => {
    const allPromise = [...pickerPromise];
    pickerPromise = [];
    allPromise.forEach(({ rejecter }) => rejecter(new Error('cancel')));
  },
};

// ========== 地址编辑通道 ==========
// 场景：地址列表页 → 地址编辑页 → 保存后返回刷新列表
let editorPromise = [];

export const addressEditor = {
  /** 获取地址编辑 Promise */
  getPromise: () => {
    let resolver;
    let rejecter;
    const nextPromise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    editorPromise.push({ resolver, rejecter });
    return nextPromise;
  },

  /** 用户保存了地址 */
  resolve: (result) => {
    const allPromise = [...editorPromise];
    editorPromise = [];
    console.info('用户保存了地址', result);
    allPromise.forEach(({ resolver }) => resolver(result));
  },

  /** 用户取消编辑 */
  reject: () => {
    const allPromise = [...editorPromise];
    editorPromise = [];
    allPromise.forEach(({ rejecter }) => rejecter(new Error('cancel')));
  },
};
