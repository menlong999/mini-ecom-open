import { createGoods, updateGoods, getGoodsDetail } from '../../../../services/admin/goodsMgr';
import {
  fetchAllCategories,
  filterCategory2ByCategory1,
  getCategory1IdValue,
} from '../../../../services/admin/categoryService';
import { uploadImages } from '../../../../utils/uploadHelper';
import { generateId } from '../../../../utils/util';
import Toast from 'tdesign-miniprogram/toast/index';

Page({
  // ...
  // ...

  // ================= 基础表单 =================

  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    if (!field) return;
    this.setData({ [`formData.${field}`]: value });
  },

  onSwitchChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    if (!field) return;
    this.setData({ [`formData.${field}`]: value });
  },

  // ================= 规格管理 =================

  onAddSpec() {
    const { formData } = this.data;
    const newSpec = {
      specId: generateId('SPEC'),
      title: '',
      values: [],
    };
    this.setData({
      'formData.specList': [...(formData.specList || []), newSpec],
    });
  },

  onSpecTitleChange(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    if (index === undefined) return;
    this.setData({ [`formData.specList[${index}].title`]: value });
  },

  onDeleteSpec(e) {
    const { index } = e.currentTarget.dataset;
    const specList = [...(this.data.formData.specList || [])];
    specList.splice(index, 1);
    this.setData({ 'formData.specList': specList }, () => {
      this.generateSkus();
    });
  },

  onShowAddValue(e) {
    const { index } = e.currentTarget.dataset;
    if (index === undefined) return;
    this.setData({
      showAddValueDialog: true,
      currentSpecIndex: index,
      tempSpecValue: '',
    });
  },

  onCancelAddValue() {
    this.setData({
      showAddValueDialog: false,
      tempSpecValue: '',
      currentSpecIndex: -1,
    });
  },

  onTempSpecValueChange(e) {
    this.setData({ tempSpecValue: e.detail.value });
  },

  onConfirmAddValue() {
    const { currentSpecIndex, tempSpecValue, formData } = this.data;
    if (!tempSpecValue.trim()) return;

    const spec = formData.specList[currentSpecIndex];
    const newVal = {
      valueId: generateId('SPECVAL'),
      value: tempSpecValue,
    };

    // 添加并更新
    const newValues = [...(spec.values || []), newVal];
    this.setData(
      {
        [`formData.specList[${currentSpecIndex}].values`]: newValues,
        showAddValueDialog: false,
        tempSpecValue: '',
      },
      () => {
        this.generateSkus();
      }
    );
  },

  onDeleteSpecValue(e) {
    const { specIndex, valIndex } = e.currentTarget.dataset;
    const specList = [...(this.data.formData.specList || [])];
    const spec = specList[specIndex];
    if (!spec) return;
    const values = [...(spec.values || [])];
    values.splice(valIndex, 1);
    specList[specIndex] = { ...spec, values };
    this.setData({ 'formData.specList': specList }, () => {
      this.generateSkus();
    });
  },

  // ================= 标签管理 =================

  onShowAddTag() {
    this.setData({ showAddTagDialog: true });
  },

  onCancelAddTag() {
    this.setData({ showAddTagDialog: false, tempTagValue: '' });
  },

  onTempTagValueChange(e) {
    this.setData({ tempTagValue: e.detail.value });
  },

  onConfirmAddTag() {
    const { tempTagValue, formData } = this.data;
    const value = tempTagValue.trim();
    if (!value) return;

    const tags = formData.tags || [];
    if (tags.includes(value)) {
      Toast({ context: this, selector: '#t-toast', theme: 'warning', message: '标签已存在' });
      return;
    }

    this.setData({
      'formData.tags': [...tags, value],
      showAddTagDialog: false,
      tempTagValue: '',
    });
  },

  onDeleteTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = [...(this.data.formData.tags || [])];
    tags.splice(index, 1);
    this.setData({ 'formData.tags': tags });
  },

  // ...

  // ================= SKU 生成 =================

  generateSkus() {
    const { formData } = this.data;
    const specs = formData.specList || [];

    // 如果没有规格，清空 SKU
    if (specs.length === 0 || specs.some((s) => s.values.length === 0)) {
      this.setData({ 'formData.skuList': [] });
      return;
    }

    // 笛卡尔积算法
    const cartesian = (args) => {
      const r = [],
        max = args.length - 1;
      function helper(arr, i) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0); // 克隆 arr
          a.push(args[i][j]);
          if (i == max) r.push(a);
          else helper(a, i + 1);
        }
      }
      helper([], 0);
      return r;
    };

    const specValuesArrays = specs.map((s) =>
      s.values.map((v) => ({
        specId: s.specId,
        specValueId: v.valueId,
        specValue: v.value || '?', // 携带值用于显示
        specTitle: s.title,
      }))
    );

    console.log('[generateSkus] specValuesArrays:', specValuesArrays);

    const combinations = cartesian(specValuesArrays);

    // 将组合映射为 SKU 对象
    const existingSkusMap = {};
    (formData.skuList || []).forEach((sku) => {
      const key = sku.specValues
        .map((sv) => sv.specValueId)
        .sort()
        .join('_');
      existingSkusMap[key] = sku;
    });

    const newSkuList = combinations.map((combo) => {
      const key = combo
        .map((c) => c.specValueId)
        .sort()
        .join('_');
      const existing = existingSkusMap[key];

      return {
        skuId: existing ? existing.skuId : generateId('SKU'),
        price: existing ? existing.price : formData.minSalePrice, // 默认为 SPU 价格
        stock: existing ? existing.stock : 0,
        // sku 图片：空字符串表示“未自定义”，保存时云函数会回退到 primaryImage
        image: existing ? existing.image || '' : '',
        specValues: combo,
      };
    });

    this.setData({ 'formData.skuList': newSkuList }, () => {
      this.updateSpuPrice();
      this.updateSpuStock();
    });
  },
  data: {
    id: '', // 如果是编辑模式则为商品ID
    formData: {
      title: '',
      minSalePrice: '',
      maxLinePrice: '',
      spuStockQuantity: '',
      desc: [],
      categoryId: '',
      primaryImage: '',
      images: [], // 轮播图 URL 列表
      isPutOnSale: true,
      tags: [],
      specList: [],
      skuList: [],
    },
    // TDesign 上传组件文件列表
    primaryFileList: [],
    imagesFileList: [],
    descFileList: [],
    // 用于 SKU 图片未自定义时的回退预览（优先显示本地临时主图）
    primaryPreviewUrl: '',

    showAddValueDialog: false,
    tempSpecValue: '',
    currentSpecIndex: -1,
    showAddTagDialog: false,
    tempTagValue: '',

    // Category data
    category1List: [],
    category2List: [],
    filteredCategory2List: [],
    selectedCategory1Id: '',
    selectedCategory1Name: '',
    selectedCategory2Name: '',
    selectedCategory1Index: -1,
    selectedCategory2Index: -1,
    showCategory1Picker: false,
    showCategory2Picker: false,
  },

  markPrevPageRefresh() {
    const pages = getCurrentPages();
    const prevPage = pages.length > 1 ? pages[pages.length - 2] : null;
    if (prevPage && typeof prevPage.setData === 'function') {
      prevPage.setData({ backRefresh: true });
    }
  },

  onLoad(options) {
    // 先加载分类数据，再加载详情
    this.loadCategories().then(() => {
      if (options.id) {
        this.setData({ id: options.id });
        wx.setNavigationBarTitle({ title: '编辑商品' });
        this.loadDetail(options.id);
      } else {
        wx.setNavigationBarTitle({ title: '新增商品' });
      }
    });
  },

  async loadCategories() {
    try {
      const { category1List, category2List } = await fetchAllCategories();
      this.setData({ category1List, category2List });
    } catch (err) {
      console.error('[loadCategories] Error:', err);
    }
  },

  async loadDetail(id) {
    try {
      const data = await getGoodsDetail(id);

      // 辅助函数：格式化文件列表
      const toFileList = (urls = []) =>
        (Array.isArray(urls) ? urls : [urls])
          .filter((u) => u)
          .map((url) => ({
            url,
            name: 'media',
            type: url.match(/\.(mp4|mov)$/i) ? 'video' : 'image',
          }));

      const descUrls = data.desc;
      const normalizedSkuList = (data.skuList || []).map((sku) => ({
        ...sku,
        // 历史数据兼容：之前写入 sku.image = spu.primaryImage，这里视为“未自定义”
        image: sku && sku.image && sku.image === data.primaryImage ? '' : (sku && sku.image) || '',
      }));
      this.setData(
        {
          formData: {
            title: data.title,
            minSalePrice: data.minSalePrice,
            maxLinePrice: data.maxLinePrice,
            spuStockQuantity: data.spuStockQuantity,
            desc: descUrls,
            categoryId: data.categoryId,
            primaryImage: data.primaryImage,
            images: data.images || [],
            isPutOnSale: data.isPutOnSale,
            tags: data.tags || [],
            specList: data.specList || [],
            skuList: normalizedSkuList,
          },
          primaryFileList: toFileList(data.primaryImage),
          imagesFileList: toFileList(data.images),
          descFileList: toFileList(descUrls),
          primaryPreviewUrl: data.primaryImage || '',
        },
        () => {
          // 1. 初始化分类选中状态
          if (data.categoryId) {
            const c2 = this.data.category2List.find((c) => c._id === data.categoryId);
            if (c2) {
              const c1Id = getCategory1IdValue(c2.category1Id);
              const c1 = this.data.category1List.find((c) => c._id === c1Id);
              const filteredCategory2List = filterCategory2ByCategory1(
                this.data.category2List,
                c1 ? c1._id : ''
              );
              const c1Index = this.data.category1List.findIndex(
                (c) => c._id === (c1 ? c1._id : '')
              );
              const c2Index = filteredCategory2List.findIndex((c) => c._id === data.categoryId);

              this.setData({
                selectedCategory1Id: c1 ? c1._id : '',
                selectedCategory1Name: c1 ? c1.category1Name : '',
                selectedCategory1Index: c1Index,
                selectedCategory2Name: c2.category2Name,
                selectedCategory2Index: c2Index,
                filteredCategory2List,
              });
            }
          }

          // 2. 确保 SKU 生成并正确显示名称
          if (this.data.formData.specList.length > 0) {
            this.generateSkus();
          }
        }
      );
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', theme: 'error', message: '加载详情失败' });
    }
  },

  // ... (lines 188-236 omitted, no changes)

  // --- 媒体处理程序 (参考 after-service 实现) ---

  // 通用成功回调：直接更新 files 列表
  handleSuccess(e, listKey) {
    const { files } = e.detail;
    const nextData = { [listKey]: files };
    // 用于 SKU 图片未自定义时的回退预览（优先显示本地临时图）
    if (listKey === 'primaryFileList') {
      nextData.primaryPreviewUrl = files && files[0] ? files[0].url : '';
    }
    this.setData(nextData);
  },

  // 通用删除回调：直接更新 files 列表
  handleRemove(e, listKey) {
    const { index } = e.detail;
    const currentFiles = [...this.data[listKey]];
    currentFiles.splice(index, 1);
    const nextData = { [listKey]: currentFiles };
    if (listKey === 'primaryFileList') {
      nextData.primaryPreviewUrl = currentFiles && currentFiles[0] ? currentFiles[0].url : '';
    }
    this.setData(nextData);
  },

  // 1. 主图
  onSuccessPrimaryImage(e) {
    this.handleSuccess(e, 'primaryFileList');
  },
  onRemovePrimaryImage(e) {
    this.handleRemove(e, 'primaryFileList');
  },

  // 2. 轮播图
  onSuccessCarouselImage(e) {
    this.handleSuccess(e, 'imagesFileList');
  },
  onRemoveCarouselImage(e) {
    this.handleRemove(e, 'imagesFileList');
  },

  // 3. 详情图
  onSuccessDescImage(e) {
    this.handleSuccess(e, 'descFileList');
  },
  onRemoveDescImage(e) {
    this.handleRemove(e, 'descFileList');
  },

  // ================= SKU 图片（按规格组合） =================

  async onChooseSkuImage(e) {
    const { index } = e.currentTarget.dataset;
    if (index === undefined) return;

    try {
      const chooseRes = await new Promise((resolve, reject) => {
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject,
        });
      });
      const tempFilePath = chooseRes && chooseRes.tempFilePaths && chooseRes.tempFilePaths[0];
      if (!tempFilePath) return;

      wx.showLoading({ title: '上传中...' });
      const [fileId] = await uploadImages([{ url: tempFilePath }], 'goods/sku');
      if (!fileId) throw new Error('上传失败');

      this.setData({
        [`formData.skuList[${index}].image`]: fileId,
      });
    } catch (err) {
      console.error('[onChooseSkuImage] error:', err);
      Toast({
        context: this,
        selector: '#t-toast',
        theme: 'error',
        message: (err && err.message) || '上传失败',
      });
    } finally {
      wx.hideLoading();
    }
  },

  onClearSkuImage(e) {
    const { index } = e.currentTarget.dataset;
    if (index === undefined) return;
    this.setData({
      [`formData.skuList[${index}].image`]: '',
    });
  },

  async onSubmit() {
    // 1. 基础校验
    const { id, formData, primaryFileList, imagesFileList, descFileList } = this.data;

    if (!formData.title || !formData.minSalePrice) {
      Toast({ context: this, selector: '#t-toast', theme: 'warning', message: '请填写标题和价格' });
      return;
    }

    // 校验规格
    if (formData.specList && formData.specList.length > 0) {
      for (const spec of formData.specList) {
        if (!spec.title) {
          Toast({
            context: this,
            selector: '#t-toast',
            theme: 'warning',
            message: '请填写规格名称',
          });
          return;
        }
        if (!spec.values || spec.values.length === 0) {
          Toast({
            context: this,
            selector: '#t-toast',
            theme: 'warning',
            message: `请为规格 ${spec.title} 添加值`,
          });
          return;
        }
      }
    }

    wx.showLoading({ title: '保存中...' });

    try {
      // 2. 上传图片 (Upload on Submit using common utility)
      // 注意：这里需要并发上传三组图片
      const [primaryUrls, imageUrls, descUrls] = await Promise.all([
        uploadImages(primaryFileList, 'goods'),
        uploadImages(imagesFileList, 'goods'),
        uploadImages(descFileList, 'goods'),
      ]);

      // 3. 更新 formData
      const finalData = {
        ...formData,
        primaryImage: primaryUrls[0] || '',
        images: imageUrls,
        desc: descUrls,
      };

      // 4. 调用云函数
      if (id) {
        await updateGoods(id, finalData);
        Toast({ context: this, selector: '#t-toast', theme: 'success', message: '更新成功' });
      } else {
        await createGoods(finalData);
        Toast({ context: this, selector: '#t-toast', theme: 'success', message: '创建成功' });
      }

      setTimeout(() => {
        this.markPrevPageRefresh();
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error(err);
      Toast({
        context: this,
        selector: '#t-toast',
        theme: 'error',
        message: err.message || '保存失败',
      });
    } finally {
      wx.hideLoading();
    }
  },

  onSkuPriceChange(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({ [`formData.skuList[${index}].price`]: Number(value) }, () => {
      this.updateSpuPrice();
    });
  },

  onSkuStockChange(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({ [`formData.skuList[${index}].stock`]: Number(value) }, () => {
      // 可选：自动汇总库存到 SPU 总库存？
      // 方便起见，做一下汇总
      this.updateSpuStock();
    });
  },

  updateSpuStock() {
    const { formData } = this.data;
    const total = (formData.skuList || []).reduce((acc, cur) => acc + Number(cur.stock || 0), 0);
    if (total > 0) {
      this.setData({ 'formData.spuStockQuantity': total });
    }
  },

  updateSpuPrice() {
    const { formData } = this.data;
    const prices = (formData.skuList || [])
      .map((sku) => Number(sku.price || 0))
      .filter((p) => p > 0);

    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // 逻辑:
      // minSalePrice = 最低 SKU 价格
      // maxLinePrice = 最高 SKU 价格 * 1.5 (按照需求: "最高SKU + 50%")

      this.setData({
        'formData.minSalePrice': minPrice,
        'formData.maxLinePrice': (maxPrice * 1.5).toFixed(2),
      });
    }
  },

  // ================= 分类选择 =================

  onShowCategory1Picker() {
    this.setData({ showCategory1Picker: true });
  },

  onCategory1PickerChange(e) {
    const { value } = e.detail;
    const selectedId = value[0];
    const index = this.data.category1List.findIndex((item) => item._id === selectedId);
    const category1 = this.data.category1List[index];

    if (category1) {
      const filteredCategory2List = filterCategory2ByCategory1(
        this.data.category2List,
        category1._id
      );
      this.setData({
        selectedCategory1Id: category1._id,
        selectedCategory1Name: category1.category1Name,
        selectedCategory1Index: index,
        filteredCategory2List,
        // Reset category 2
        'formData.categoryId': '',
        selectedCategory2Name: '',
        selectedCategory2Index: -1,
      });
    }
    this.setData({ showCategory1Picker: false });
  },

  onCategory1PickerCancel() {
    this.setData({ showCategory1Picker: false });
  },

  onShowCategory2Picker() {
    if (!this.data.selectedCategory1Id) {
      Toast({ context: this, selector: '#t-toast', message: '请先选择一级分类' });
      return;
    }
    this.setData({ showCategory2Picker: true });
  },

  onCategory2PickerChange(e) {
    const { value } = e.detail;
    const selectedId = value[0];
    const index = this.data.filteredCategory2List.findIndex((item) => item._id === selectedId);
    const category2 = this.data.filteredCategory2List[index];

    if (category2) {
      this.setData({
        'formData.categoryId': category2._id,
        selectedCategory2Name: category2.category2Name,
        selectedCategory2Index: index,
      });
    }
    this.setData({ showCategory2Picker: false });
  },

  onCategory2PickerCancel() {
    this.setData({ showCategory2Picker: false });
  },
});
