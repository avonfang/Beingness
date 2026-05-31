Component({
  data: {
    active: 0,
    tabs: [
      { icon: '🧘', label: '此刻', pagePath: '/pages/index/index' },
      { icon: '📋', label: '日志', pagePath: '/pages/log/log' },
      { icon: '👤', label: '个人', pagePath: '/pages/profile/profile' }
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
