Component({
  data: { step: 0 },

  methods: {
    next() {
      if (this.data.step < 1) {
        this.setData({ step: this.data.step + 1 })
      }
    },

    startFirstAid() {
      wx.setStorageSync('hasSeenOnboarding', true)
      this.triggerEvent('finish')
      wx.navigateTo({ url: '/pages/emergency/emergency' })
    },

    finish() {
      wx.setStorageSync('hasSeenOnboarding', true)
      this.triggerEvent('finish')
    }
  }
})
