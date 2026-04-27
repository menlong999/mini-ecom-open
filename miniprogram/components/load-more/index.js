Component({
  externalClasses: ['wr-class', 'wr-class--no-more'],

  options: { multipleSlots: true },

  properties: {
    status: {
      type: Number,
      value: 0,
    },
    loadingText: {
      type: String,
      value: '加载中...',
    },
    noMoreText: {
      type: String,
      value: '没有更多了',
    },
    failedText: {
      type: String,
      value: '加载失败，点击重试',
    },
    color: {
      type: String,
      value: '#9AA19A',
    },
    failedColor: {
      type: String,
      value: '#4F6F64',
    },
    size: {
      type: null,
      value: '40rpx',
    },
    loadingBackgroundColor: {
      type: String,
      value: '#F6F7F5',
    },
    listIsEmpty: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    /** 点击处理 */
    tapHandle() {
      // 失败重试
      if (this.data.status === 3) {
        this.triggerEvent('retry');
      }
    },
  },
});
