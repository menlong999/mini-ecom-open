// 请将以下代码复制到微信开发者工具的 Console (调试器) 中按回车执行
// 该脚本会将商品表中现存的金额字段统一乘以 100 转换为“分”

wx.cloud.init();
const db = wx.cloud.database();

async function migrateGoods() {
  try {
    wx.showLoading({ title: '迁移 SPU...' });
    console.log('🚀 开始迁移 goods_spu...');
    const spuRes = await db.collection('goods_spu').limit(100).get();
    
    let spuCount = 0;
    for (let spu of spuRes.data) {
      // 简单防护：如果价格已经很大（比如超过 10000），说明可能已经是分了（或者是特别贵的商品），这里假设原测试数据都在几百元以内
      // 你可以去掉这个防护，强制全部乘以 100
      if (spu.minSalePrice && spu.minSalePrice < 1000) {
        await db.collection('goods_spu').doc(spu._id).update({
          data: {
            minSalePrice: Math.round(Number(spu.minSalePrice || 0) * 100),
            maxLinePrice: Math.round(Number(spu.maxLinePrice || 0) * 100)
          }
        });
        spuCount++;
        console.log(`✅ SPU ${spu._id} (${spu.title}) 迁移成功`);
      }
    }
    
    wx.showLoading({ title: '迁移 SKU...' });
    console.log('🚀 开始迁移 goods_sku...');
    const skuRes = await db.collection('goods_sku').limit(500).get();
    
    let skuCount = 0;
    for (let sku of skuRes.data) {
      if (sku.price && sku.price < 1000) {
        await db.collection('goods_sku').doc(sku._id).update({
          data: {
            price: Math.round(Number(sku.price || 0) * 100)
          }
        });
        skuCount++;
        console.log(`✅ SKU ${sku._id} 迁移成功`);
      }
    }
    
    wx.hideLoading();
    console.log(`🎉 迁移完成！共更新了 ${spuCount} 个商品和 ${skuCount} 个规格。`);
    wx.showToast({ title: '迁移完成', icon: 'success' });
  } catch (err) {
    wx.hideLoading();
    console.error('❌ 迁移失败:', err);
  }
}

migrateGoods();
