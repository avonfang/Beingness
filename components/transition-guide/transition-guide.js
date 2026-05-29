const MIN_DWELL = 1500

Component({
  properties: {
    streakDays: { type: Number, value: 0 }
  },
  data: { phase: 'enter', canDismiss: false },

  lifetimes: {
    attached() {
      setTimeout(() => this.setData({ phase: 'show' }), 100)
      this._timer = setTimeout(() => {
        this.setData({ canDismiss: true })
      }, MIN_DWELL)
    },
    detached() {
      if (this._timer) clearTimeout(this._timer)
    }
  },

  methods: {
    dismiss() {
      if (!this.data.canDismiss) return
      wx.setStorageSync('hasSeenV5Guide', true)
      this.triggerEvent('finish')
    }
  }
})
