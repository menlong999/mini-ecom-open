import Toast from 'tdesign-miniprogram/toast/index';
import { uploadImages } from '../../../utils/uploadHelper';
import {
  fetchCategory1List,
  fetchCategory2List,
  createCategory1,
  updateCategory1,
  deleteCategory1,
  createCategory2,
  updateCategory2,
  deleteCategory2,
} from '../../../services/admin/categoryMgr';

const TABS = [
  { key: 'category1', text: '一级分类' },
  { key: 'category2', text: '二级分类' },
];

function getCategory1IdValue(category1Id) {
  if (!category1Id) return '';
  if (typeof category1Id === 'string') return category1Id;
  if (typeof category1Id === 'object') return category1Id._id || '';
  return '';
}

function getThumbnailUrl(thumbnail) {
  if (!thumbnail) return '';
  if (typeof thumbnail === 'string') return thumbnail;
  if (typeof thumbnail === 'object') {
    return thumbnail.url || thumbnail.fileID || thumbnail.tempFileURL || '';
  }
  return '';
}

function toFileList(thumbnail) {
  const url = getThumbnailUrl(thumbnail);
  return url ? [{ url }] : [];
}

Page({
  data: {
    tabs: TABS,
    currentTab: 'category1',
    category1List: [],
    category2List: [],
    displayList: [],
    category2Groups: [],
    category1Options: [],
    loading: false,

    dialogVisible: false,
    dialogMode: 'create',
    dialogTitle: '',
    dialogLoading: false,
    formName: '',
    formCategory1Id: '',
    formCategory1Name: '',
    thumbFileList: [],
    editingId: '',

    showCategory1Picker: false,
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [category1List, category2List] = await Promise.all([
        fetchCategory1List(),
        fetchCategory2List(),
      ]);
      const category1Options = category1List.map((item) => ({
        label: item.category1Name,
        value: item._id,
      }));

      this.setData(
        {
          category1List,
          category2List,
          category1Options,
        },
        () => this.buildDisplayList()
      );
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '加载失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  buildDisplayList() {
    const { currentTab, category1List, category2List } = this.data;
    if (currentTab === 'category1') {
      const list = category1List.map((item) => ({
        ...item,
        name: item.category1Name,
        thumbnailUrl: getThumbnailUrl(item.thumbnail),
      }));
      this.setData({ displayList: list, category2Groups: [] });
      return;
    }

    const groups = category1List.map((c1) => {
      const children = category2List
        .filter((c2) => getCategory1IdValue(c2.category1Id) === c1._id)
        .map((c2) => ({
          ...c2,
          name: c2.category2Name,
          thumbnailUrl: getThumbnailUrl(c2.thumbnail),
        }));
      return {
        _id: c1._id,
        name: c1.category1Name,
        children,
      };
    });
    this.setData({ category2Groups: groups });
  },

  onTabTap(e) {
    const { key } = e.currentTarget.dataset;
    if (!key || key === this.data.currentTab) return;
    this.setData({ currentTab: key }, () => this.buildDisplayList());
  },

  onAddTap() {
    if (this.data.currentTab !== 'category1') {
      return;
    }
    if (this.data.category1List.length === 0) {
      Toast({ context: this, selector: '#t-toast', message: '请先创建一级分类' });
      return;
    }
    this.openDialog('create');
  },

  onAddCategory2Tap(e) {
    if (this.data.category1List.length === 0) {
      Toast({ context: this, selector: '#t-toast', message: '请先创建一级分类' });
      return;
    }
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    this.openDialog('create', { category1Id: id });
  },

  onEditTap(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    const list =
      this.data.currentTab === 'category1' ? this.data.category1List : this.data.category2List;
    const item = list.find((row) => row._id === id);
    if (!item) return;
    this.openDialog('edit', item);
  },

  openDialog(mode, item = {}) {
    const isCategory1 = this.data.currentTab === 'category1';
    let formCategory1Id = '';
    let formCategory1Name = '';
    if (!isCategory1) {
      const parentId = getCategory1IdValue(item.category1Id);
      const parent = this.data.category1List.find((c) => c._id === parentId);
      formCategory1Id = parent ? parent._id : '';
      formCategory1Name = parent ? parent.category1Name : '';
    }

    this.setData({
      dialogVisible: true,
      dialogMode: mode,
      dialogTitle:
        mode === 'create'
          ? isCategory1
            ? '新增一级分类'
            : '新增二级分类'
          : isCategory1
          ? '编辑一级分类'
          : '编辑二级分类',
      formName: isCategory1 ? item.category1Name || '' : item.category2Name || '',
      formCategory1Id,
      formCategory1Name,
      thumbFileList: toFileList(item.thumbnail),
      editingId: item._id || '',
    });
  },

  onDialogCancel() {
    this.setData({ dialogVisible: false, dialogLoading: false });
  },

  onNameChange(e) {
    this.setData({ formName: e.detail.value });
  },

  onShowCategory1Picker() {
    if (this.data.category1List.length === 0) {
      Toast({ context: this, selector: '#t-toast', message: '请先创建一级分类' });
      return;
    }
    this.setData({ showCategory1Picker: true });
  },

  onCategory1PickerChange(e) {
    const id = e.detail.value[0];
    const selected = this.data.category1List.find((item) => item._id === id);
    this.setData({
      formCategory1Id: selected ? selected._id : '',
      formCategory1Name: selected ? selected.category1Name : '',
      showCategory1Picker: false,
    });
  },

  onCategory1PickerCancel() {
    this.setData({ showCategory1Picker: false });
  },

  onThumbSuccess(e) {
    const { files } = e.detail;
    this.setData({ thumbFileList: files });
  },

  onThumbRemove(e) {
    const { index } = e.detail;
    const list = [...this.data.thumbFileList];
    list.splice(index, 1);
    this.setData({ thumbFileList: list });
  },

  async onDialogConfirm() {
    if (this.data.dialogLoading) return;
    const { formName, formCategory1Id, thumbFileList, dialogMode, editingId } = this.data;
    const isCategory1 = this.data.currentTab === 'category1';

    if (!formName) {
      Toast({ context: this, selector: '#t-toast', message: '请输入分类名称' });
      return;
    }
    if (!thumbFileList.length) {
      Toast({ context: this, selector: '#t-toast', message: '请上传分类缩略图' });
      return;
    }
    if (!isCategory1 && !formCategory1Id) {
      Toast({ context: this, selector: '#t-toast', message: '请选择所属一级分类' });
      return;
    }

    this.setData({ dialogLoading: true });
    try {
      const [thumbnail] = await uploadImages(thumbFileList, 'category');
      if (dialogMode === 'create') {
        if (isCategory1) {
          await createCategory1({ category1Name: formName, thumbnail });
        } else {
          await createCategory2({
            category2Name: formName,
            category1Id: formCategory1Id,
            thumbnail,
          });
        }
      } else if (isCategory1) {
        await updateCategory1({ id: editingId, category1Name: formName, thumbnail });
      } else {
        await updateCategory2({
          id: editingId,
          category2Name: formName,
          category1Id: formCategory1Id,
          thumbnail,
        });
      }
      Toast({ context: this, selector: '#t-toast', message: '保存成功' });
      this.setData({ dialogVisible: false, dialogLoading: false });
      await this.loadData();
    } catch (err) {
      console.error(err);
      Toast({ context: this, selector: '#t-toast', message: err.message || '保存失败' });
      this.setData({ dialogLoading: false });
    }
  },

  onDeleteTap(e) {
    const { id } = e.currentTarget.dataset;
    if (!id) return;
    const isCategory1 = this.data.currentTab === 'category1';
    const content = isCategory1 ? '确认删除该一级分类？' : '确认删除该二级分类？';

    wx.showModal({
      title: '删除确认',
      content,
      confirmText: '删除',
      confirmColor: '#fa4126',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          if (isCategory1) {
            await deleteCategory1(id);
          } else {
            await deleteCategory2(id);
          }
          Toast({ context: this, selector: '#t-toast', message: '删除成功' });
          await this.loadData();
        } catch (err) {
          console.error(err);
          Toast({ context: this, selector: '#t-toast', message: err.message || '删除失败' });
        }
      },
    });
  },
});
