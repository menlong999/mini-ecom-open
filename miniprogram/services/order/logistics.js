import { runtimeConfig } from '../../config/index';

// 保存/更新物流信息
export function updateLogistics(params) {
  return wx.cloud
    .callFunction({
      name: 'manageAfterService',
      data: {
        action: 'updateLogistics',
        payload: params,
      },
    })
    .then((res) => {
      if (res.result && res.result.success) {
        return res.result.data || {};
      }
      throw new Error((res.result && res.result.message) || 'Save failed');
    });
}

export function getDeliverCompanyList() {
  const _resq = {
    data: runtimeConfig.logistics?.companies || [],
  };
  return Promise.resolve(_resq);
}

export function fetchLogisticsTrack(params) {
  return wx.cloud
    .callFunction({
      name: 'getLogisticsTrack',
      data: params,
    })
    .then((res) => {
      if (res.result && res.result.code === 'Success') {
        return res.result.data;
      }
      throw new Error((res.result && res.result.msg) || 'Fetch logistics failed');
    });
}
