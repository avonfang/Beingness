App({
  globalData: {
    openid: '',
    userInfo: null
  },
  onLaunch() {
    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true
    })
    // 自动登录并同步觉醒币
    this.syncCoins()
  },
  syncCoins() {
    wx.cloud.callFunction({
      name: 'login'
    }).then(res => {
      const result = res.result
      this.globalData.openid = result.openid
      if (result.coins) {
        wx.setStorageSync('awakeningCoins', result.coins)
      }
    }).catch(() => {
      // 静默失败，本地缓存兜底
    })
  }
})
