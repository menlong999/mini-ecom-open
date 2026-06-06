const fs = require('fs');
const https = require('https');

// Fix SDK
const sdkFiles = [
  'miniprogram/utils/wxCloudClientSDK.umd.js',
  'cloudfunctions/login/wxCloudClientSDK.umd.js',
  'cloudfunctions/paymentCallback/wxCloudClientSDK.umd.js',
  'cloudfunctions/refundCallback/wxCloudClientSDK.umd.js'
];

const targetSDK = `    if (typeof wx !== 'undefined' && wx.getSystemInfo) {
      var ua_1;
      // 同步接口
      // @ts-ignore
      wx.getSystemInfo({
        success: function (res) {
          if (!res) return;
          ua_1 = ['brand', 'model', 'version', 'system', 'platform', 'SDKVersion', 'language']
            .map(function (k) {
              return ''.concat(k, ': ').concat(res[k]);
            })
            .join(', ');
        },
      });
      return ua_1;
    }`;

const replaceSDK = `    if (typeof wx !== 'undefined') {
      var ua_1;
      try {
        var res = {};
        if (wx.getDeviceInfo && wx.getAppBaseInfo) {
          res = Object.assign({}, wx.getDeviceInfo(), wx.getAppBaseInfo());
        } else if (wx.getSystemInfoSync) {
          res = wx.getSystemInfoSync();
        }
        if (res && res.brand) {
          ua_1 = ['brand', 'model', 'version', 'system', 'platform', 'SDKVersion', 'language']
            .map(function (k) {
              return ''.concat(k, ': ').concat(res[k]);
            })
            .join(', ');
        }
      } catch (e) {}
      return ua_1;
    }`;

for (const f of sdkFiles) {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes(targetSDK)) {
      content = content.replace(targetSDK, replaceSDK);
      fs.writeFileSync(f, content, 'utf8');
      console.log(`[SDK] Patched ${f}`);
    } else {
      console.log(`[SDK] Target not found in ${f}`);
    }
  }
}

// Fix font
const fontUrl = "https://cdn3.codesign.qq.com/icons/gqxWyZ1yMJZmVXk/Yyg5Zp2LG8292lK/iconfont.woff?t=cfc62dd36011e60805f5c3ad1a20b642";
https.get(fontUrl, (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const b64 = buffer.toString('base64');
    const wxssPath = 'miniprogram/style/iconfont.wxss';
    let wxssContent = fs.readFileSync(wxssPath, 'utf8');
    const oldUrl = "url('https://cdn3.codesign.qq.com/icons/gqxWyZ1yMJZmVXk/Yyg5Zp2LG8292lK/iconfont.woff?t=cfc62dd36011e60805f5c3ad1a20b642')";
    const newUrl = `url('data:application/font-woff;charset=utf-8;base64,${b64}')`;
    wxssContent = wxssContent.replace(oldUrl, newUrl);
    fs.writeFileSync(wxssPath, wxssContent, 'utf8');
    console.log('[WXSS] Patched iconfont.wxss');
  });
}).on('error', (err) => {
  console.error('[WXSS] Error downloading font:', err);
});
