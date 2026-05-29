Component({
  data: { step: 0 },

  methods: {
    next() {
      if (this.data.step < 1) {
        this.setData({ step: this.data.step + 1 })
      }
    },

    finish() {
      wx.setStorageSync('hasSeenOnboarding', true)
      this.triggerEvent('finish')
    }
  }
})
