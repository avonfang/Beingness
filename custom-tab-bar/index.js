Component({
  data: {
    active: 0,
    tabs: [
      { icon: '🏠', label: '主页', pagePath: '/pages/index/index' },
      { icon: '🔍', label: '探索', pagePath: '/pages/learning/learning' },
      { icon: '📄', label: '记录', pagePath: '/pages/log/log' },
      { icon: '👤', label: '我的', pagePath: '/pages/profile/profile' }
    ]
  },

  pageLifetimes: {
    show() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage) {
        const route = '/' + currentPage.route
        const idx = this.data.tabs.findIndex(t => route.startsWith(t.pagePath))
        if (idx >= 0) this.setData({ active: idx })
      }
    }
  },

  methods: {
    switchTab(e) {
      const idx = e.currentTarget.dataset.index
      const tab = this.data.tabs[idx]
      if (idx === this.data.active) return
      this.setData({ active: idx })
      wx.switchTab({ url: tab.pagePath })
    }
  }
})
