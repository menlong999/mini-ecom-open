import Toast from 'tdesign-miniprogram/toast/index';
import { uploadImages } from '../../../utils/uploadHelper';
import { getHomeConfig, saveHomeConfig } from '../../../services/admin/homeConfigMgr';
import {
  fetchGoodsBriefMap,
  fetchGoodsList as fetchAdminGoodsList,
} from '../../../services/admin/goodsMgr';

function genKey() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function moveInArray(arr, fromIndex, toIndex) {
  const next = arr.slice();
  if (fromIndex === toIndex) return next;
  if (fromIndex < 0 || fromIndex >= next.length) return next;
  if (toIndex < 0 || toIndex >= next.length) return next;
  const item = next.splice(fromIndex, 1)[0];
  next.splice(toIndex, 0, item);
  return next;
}

function uniq(arr) {
  const set = new Set();
  return arr.filter((v) => {
    if (!v) return false;
    if (set.has(v)) return false;
    set.add(v);
    return true;
  });
}

async function fetchSpuBriefMap(ids) {
  return fetchGoodsBriefMap(ids);
}

Page({
  data: {
    loading: false,
    saving: false,

    configId: '',

    swiperList: [],
    tabList: [],
    goodsMap: {},

    // drag layout (px)
    swiperItemHeightPx: 0,
    tabItemHeightPx: 0,
    tabSpuItemHeightPx: 0,

    goodsPickerVisible: false,
    goodsPickerMode: '',
    goodsPickerIndex: -1,
    goodsKeyword: '',
    goodsSearchLoading: false,
    goodsSearchList: [],

    // tab goods editing (popup)
    tabEditingSpuIds: [],
    tabEditingSpuIdMap: {},
  },

  onLoad() {
    this._dragY = { swiper: {}, tab: {}, tabSpu: {} };
    this.initDragMetrics();
    this.loadConfig();
  },

  initDragMetrics() {
    const sys = wx.getSystemInfoSync();
    const pxPerRpx = sys.windowWidth / 750;
    this.setData({
      swiperItemHeightPx: Math.round(700 * pxPerRpx),
      tabItemHeightPx: Math.round(188 * pxPerRpx),
      tabSpuItemHeightPx: Math.round(96 * pxPerRpx),
    });
  },

  onDragHandleTap() {},

  async loadConfig() {
    this.setData({ loading: true });
    try {
      const config = await getHomeConfig();
      const swiperRaw = (config && config.swiper) || [];
      const tabRaw = (config && config.tabList) || [];

      const swiperList = swiperRaw.map((s) => {
        const image = (s && (s.image || s.imageUrl)) || '';
        const spuId = (s && (s.spuId || s.skuId)) || '';
        const linkType = (s && s.linkType) || 'spu';
        const poi = (s && s.poi) || {};
        return {
          _key: genKey(),
          spuId,
          linkType,
          poi: {
            name: poi.name || '',
            address: poi.address || '',
            latitude: poi.latitude || '',
            longitude: poi.longitude || '',
          },
          fileList: image ? [{ url: image }] : [],
        };
      });

      const tabList = tabRaw.map((t) => ({
        _key: genKey(),
        text: (t && t.text) || '',
        spuIds: Array.isArray(t && t.spuIds) ? t.spuIds : [],
      }));

      this.setData({
        configId: (config && config._id) || '',
        swiperList,
        tabList,
      });

      await this.refreshGoodsMap();
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async refreshGoodsMap() {
    const { swiperList, tabList } = this.data;
    const ids = [];
    swiperList.forEach((s) => s.spuId && ids.push(s.spuId));
    tabList.forEach((t) => (t.spuIds || []).forEach((id) => ids.push(id)));
    try {
      const map = await fetchSpuBriefMap(ids);
      this.setData({ goodsMap: map });
    } catch (err) {
      console.error('[home-config] refreshGoodsMap error', err);
    }
  },

  addSwiper() {
    const swiperList = this.data.swiperList.concat([
      {
        _key: genKey(),
        spuId: '',
        linkType: 'spu',
        poi: { name: '', address: '', latitude: '', longitude: '' },
        fileList: [],
      },
    ]);
    this.setData({ swiperList });
  },

  removeSwiper(e) {
    const index = Number(e.currentTarget.dataset.index);
    const swiperList = this.data.swiperList.slice();
    swiperList.splice(index, 1);
    this.setData({ swiperList }, () => this.refreshGoodsMap());
  },

  onRemoveSwiperTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;

    wx.showModal({
      title: '删除确认',
      content: '确认删除该轮播图？',
      confirmText: '删除',
      confirmColor: '#fa4126',
      success: (res) => {
        if (!res.confirm) return;
        this.removeSwiper({ currentTarget: { dataset: { index } } });
      },
    });
  },

  onChooseSwiperImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const swiperList = this.data.swiperList.slice();
    const item = swiperList[index];
    if (!item) return;

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res && res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        swiperList[index] = { ...item, fileList: [{ url: path }] };
        this.setData({ swiperList });
      },
      fail: (err) => {
        console.error('[home-config] choose swiper image fail', err);
      },
    });
  },

  onSwiperLinkTypeChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    const linkType = e.currentTarget.dataset.type;
    if (Number.isNaN(index) || !linkType) return;
    const swiperList = this.data.swiperList.slice();
    const item = swiperList[index];
    if (!item) return;
    swiperList[index] = { ...item, linkType };
    this.setData({ swiperList });
  },

  onSwiperPoiInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    const field = e.currentTarget.dataset.field;
    if (Number.isNaN(index) || !field) return;
    const value = e.detail && e.detail.value;
    const swiperList = this.data.swiperList.slice();
    const item = swiperList[index];
    if (!item) return;
    const poi = { ...(item.poi || {}) };
    poi[field] = value;
    swiperList[index] = { ...item, poi };
    this.setData({ swiperList });
  },

  onSwiperDragChange(e) {
    const fromIndex = Number(e.currentTarget.dataset.index);
    const y = Number(e.detail && e.detail.y);
    const list = this.data.swiperList || [];
    if (!list.length || Number.isNaN(fromIndex) || Number.isNaN(y)) return;

    this._dragY.swiper[fromIndex] = y;
    const source = e.detail && e.detail.source;
    if (source !== 'touch-end' && source !== 'touchend') return;

    const h = this.data.swiperItemHeightPx || 1;
    const toIndex = Math.max(0, Math.min(list.length - 1, Math.round(y / h)));
    if (toIndex === fromIndex) return;
    delete this._dragY.swiper[fromIndex];
    this.setData({ swiperList: moveInArray(list, fromIndex, toIndex) });
  },

  onSwiperDragEnd(e) {
    const fromIndex = Number(e.currentTarget.dataset.index);
    const y = this._dragY && this._dragY.swiper ? this._dragY.swiper[fromIndex] : undefined;
    const list = this.data.swiperList || [];
    if (!list.length || Number.isNaN(fromIndex) || typeof y !== 'number') return;

    const h = this.data.swiperItemHeightPx || 1;
    const toIndex = Math.max(0, Math.min(list.length - 1, Math.round(y / h)));
    delete this._dragY.swiper[fromIndex];
    if (toIndex === fromIndex) return;
    this.setData({ swiperList: moveInArray(list, fromIndex, toIndex) });
  },

  addTab() {
    const tabList = this.data.tabList.concat([{ _key: genKey(), text: '', spuIds: [] }]);
    this.setData({ tabList });
  },

  removeTab(e) {
    const index = Number(e.currentTarget.dataset.index);
    const tabList = this.data.tabList.slice();
    tabList.splice(index, 1);
    this.setData({ tabList }, () => this.refreshGoodsMap());
  },

  onRemoveTabTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    const tab = (this.data.tabList || [])[index];
    const title = (tab && tab.text) || '';

    wx.showModal({
      title: '删除确认',
      content: `确认删除${title ? ` Tab「${title}」` : '该 Tab'}？`,
      confirmText: '删除',
      confirmColor: '#fa4126',
      success: (res) => {
        if (!res.confirm) return;
        this.removeTab({ currentTarget: { dataset: { index } } });
      },
    });
  },

  onTabDragChange(e) {
    const fromIndex = Number(e.currentTarget.dataset.index);
    const y = Number(e.detail && e.detail.y);
    const list = this.data.tabList || [];
    if (!list.length || Number.isNaN(fromIndex) || Number.isNaN(y)) return;

    this._dragY.tab[fromIndex] = y;
    const source = e.detail && e.detail.source;
    if (source !== 'touch-end' && source !== 'touchend') return;

    const h = this.data.tabItemHeightPx || 1;
    const toIndex = Math.max(0, Math.min(list.length - 1, Math.round(y / h)));
    if (toIndex === fromIndex) return;
    delete this._dragY.tab[fromIndex];
    this.setData({ tabList: moveInArray(list, fromIndex, toIndex) });
  },

  onTabDragEnd(e) {
    const fromIndex = Number(e.currentTarget.dataset.index);
    const y = this._dragY && this._dragY.tab ? this._dragY.tab[fromIndex] : undefined;
    const list = this.data.tabList || [];
    if (!list.length || Number.isNaN(fromIndex) || typeof y !== 'number') return;

    const h = this.data.tabItemHeightPx || 1;
    const toIndex = Math.max(0, Math.min(list.length - 1, Math.round(y / h)));
    delete this._dragY.tab[fromIndex];
    if (toIndex === fromIndex) return;
    this.setData({ tabList: moveInArray(list, fromIndex, toIndex) });
  },

  onTabTextChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    const value = e.detail.value;
    const tabList = this.data.tabList.slice();
    const item = tabList[index];
    if (!item) return;
    tabList[index] = { ...item, text: value };
    this.setData({ tabList });
  },

  onOpenGoodsPicker(e) {
    const mode = e.currentTarget.dataset.mode;
    const index = Number(e.currentTarget.dataset.index);

    let tabEditingSpuIds = [];
    let tabEditingSpuIdMap = {};
    if (mode === 'tab') {
      const tab = (this.data.tabList || [])[index];
      tabEditingSpuIds = (tab && tab.spuIds) || [];
      tabEditingSpuIdMap = {};
      tabEditingSpuIds.forEach((id) => {
        tabEditingSpuIdMap[id] = true;
      });
    }

    this.setData(
      {
        goodsPickerVisible: true,
        goodsPickerMode: mode,
        goodsPickerIndex: index,
        goodsKeyword: '',
        goodsSearchList: [],
        tabEditingSpuIds,
        tabEditingSpuIdMap,
      },
      () => this.searchGoods()
    );
  },

  onGoodsPickerVisibleChange(e) {
    if (!e.detail.visible) {
      this.closeGoodsPicker();
    }
  },

  closeGoodsPicker() {
    this.setData({
      goodsPickerVisible: false,
      goodsPickerMode: '',
      goodsPickerIndex: -1,
      goodsKeyword: '',
      goodsSearchList: [],
      goodsSearchLoading: false,
      tabEditingSpuIds: [],
      tabEditingSpuIdMap: {},
    });
  },

  onGoodsKeywordChange(e) {
    this.setData({ goodsKeyword: e.detail.value });
  },

  async searchGoods() {
    if (this.data.goodsSearchLoading) return;
    this.setData({ goodsSearchLoading: true });
    try {
      const res = await fetchAdminGoodsList({
        page: 1,
        pageSize: 50,
        keyword: this.data.goodsKeyword || '',
      });
      this.setData({ goodsSearchList: res.list || [] });
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '查询失败' });
      this.setData({ goodsSearchList: [] });
    } finally {
      this.setData({ goodsSearchLoading: false });
    }
  },

  onSelectGoods(e) {
    const id = e.currentTarget.dataset.id;
    const { goodsPickerMode, goodsPickerIndex } = this.data;
    if (!id) return;

    if (goodsPickerMode === 'swiper') {
      const swiperList = this.data.swiperList.slice();
      const item = swiperList[goodsPickerIndex];
      if (!item) return;
      swiperList[goodsPickerIndex] = { ...item, spuId: id };
      this.setData({ swiperList }, () => this.refreshGoodsMap());
      this.closeGoodsPicker();
      return;
    }
  },

  onTabGoodsCheckChange(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const checked = !!(e && e.detail && e.detail.checked);
    const list = this.data.tabEditingSpuIds || [];
    const map = { ...(this.data.tabEditingSpuIdMap || {}) };

    let nextIds = [];
    if (!checked) {
      nextIds = list.filter((x) => x !== id);
      delete map[id];
    } else {
      nextIds = list.concat([id]);
      map[id] = true;
    }

    this.setData({ tabEditingSpuIds: nextIds, tabEditingSpuIdMap: map });
  },

  removeEditingSpu(e) {
    const index = Number(e.currentTarget.dataset.index);
    const list = (this.data.tabEditingSpuIds || []).slice();
    if (Number.isNaN(index) || index < 0 || index >= list.length) return;
    const id = list[index];
    list.splice(index, 1);
    const map = { ...(this.data.tabEditingSpuIdMap || {}) };
    if (id) delete map[id];
    this.setData({ tabEditingSpuIds: list, tabEditingSpuIdMap: map });
  },

  onTabSpuDragChange(e) {
    const fromIndex = Number(e.currentTarget.dataset.index);
    const y = Number(e.detail && e.detail.y);
    const list = this.data.tabEditingSpuIds || [];
    if (!list.length || Number.isNaN(fromIndex) || Number.isNaN(y)) return;

    this._dragY.tabSpu[fromIndex] = y;
    const source = e.detail && e.detail.source;
    if (source !== 'touch-end' && source !== 'touchend') return;

    const h = this.data.tabSpuItemHeightPx || 1;
    const toIndex = Math.max(0, Math.min(list.length - 1, Math.round(y / h)));
    if (toIndex === fromIndex) return;
    delete this._dragY.tabSpu[fromIndex];
    this.setData({ tabEditingSpuIds: moveInArray(list, fromIndex, toIndex) });
  },

  onTabSpuDragEnd(e) {
    const fromIndex = Number(e.currentTarget.dataset.index);
    const y = this._dragY && this._dragY.tabSpu ? this._dragY.tabSpu[fromIndex] : undefined;
    const list = this.data.tabEditingSpuIds || [];
    if (!list.length || Number.isNaN(fromIndex) || typeof y !== 'number') return;

    const h = this.data.tabSpuItemHeightPx || 1;
    const toIndex = Math.max(0, Math.min(list.length - 1, Math.round(y / h)));
    delete this._dragY.tabSpu[fromIndex];
    if (toIndex === fromIndex) return;
    this.setData({ tabEditingSpuIds: moveInArray(list, fromIndex, toIndex) });
  },

  confirmTabGoods() {
    const { goodsPickerMode, goodsPickerIndex } = this.data;
    if (goodsPickerMode !== 'tab') return;

    const tabList = this.data.tabList.slice();
    const tab = tabList[goodsPickerIndex];
    if (!tab) return;

    tabList[goodsPickerIndex] = { ...tab, spuIds: uniq(this.data.tabEditingSpuIds || []) };
    this.setData({ tabList }, () => {
      this.refreshGoodsMap();
      this.closeGoodsPicker();
    });
  },

  async onSave() {
    if (this.data.saving) return;

    const { configId, swiperList, tabList } = this.data;

    // 1) 基础校验
    for (let i = 0; i < tabList.length; i += 1) {
      const text = (tabList[i] && tabList[i].text) || '';
      if (!text.trim()) {
        Toast({ context: this, selector: '#t-toast', message: `第 ${i + 1} 个 Tab 标题不能为空` });
        return;
      }
    }

    for (let i = 0; i < swiperList.length; i += 1) {
      const item = swiperList[i] || {};
      if (!item.fileList || item.fileList.length === 0) {
        Toast({ context: this, selector: '#t-toast', message: `第 ${i + 1} 张轮播图请先选择图片` });
        return;
      }
      if ((item.linkType || 'spu') === 'spu' && !item.spuId) {
        Toast({ context: this, selector: '#t-toast', message: `第 ${i + 1} 张轮播图请先选择商品` });
        return;
      }
      if ((item.linkType || 'spu') === 'poi') {
        const poi = item.poi || {};
        const lat = Number(poi.latitude);
        const lng = Number(poi.longitude);
        if (!poi.name || !poi.address) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: `第 ${i + 1} 张轮播图请填写 POI 名称和地址`,
          });
          return;
        }
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: `第 ${i + 1} 张轮播图请填写正确经纬度`,
          });
          return;
        }
      }
    }

    this.setData({ saving: true });
    try {
      // 2) 上传轮播图片并组装 payload
      const swiperPayload = await Promise.all(
        swiperList.map(async (item) => {
          const firstFile = item.fileList[0];
          const [image] = await uploadImages([firstFile], 'home/swiper');
          const linkType = item.linkType || 'spu';
          const payload = { image, linkType };
          if (linkType === 'spu') {
            payload.spuId = item.spuId;
          } else if (linkType === 'poi') {
            payload.poi = {
              name: (item.poi && item.poi.name) || '',
              address: (item.poi && item.poi.address) || '',
              latitude: Number(item.poi && item.poi.latitude),
              longitude: Number(item.poi && item.poi.longitude),
            };
          }
          return payload;
        })
      );

      const payload = {
        id: configId,
        swiper: swiperPayload,
        tabList: tabList.map((t) => ({ text: t.text, spuIds: (t.spuIds || []).filter(Boolean) })),
      };

      const res = await saveHomeConfig(payload);
      if (res && res.id) {
        this.setData({ configId: res.id });
      }
      Toast({ context: this, selector: '#t-toast', message: '保存成功' });
      await this.loadConfig();
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '保存失败' });
    } finally {
      this.setData({ saving: false });
    }
  },
});
