const _dialogue = require('./data/dialogue')

App({
  globalData: {
    dialogueModule: _dialogue,
    openid: '',
    userInfo: null,
    cloudReady: false
  },

  onLaunch() {
    if (!wx.getStorageSync('hasSeenOnboarding')) {
      wx.setStorageSync('hasSeenOnboarding', false)
    }
    if (!wx.getStorageSync('streakDays')) {
      wx.setStorageSync('streakDays', 0)
    }
    if (!wx.getStorageSync('lastCheckInDate')) {
      wx.setStorageSync('lastCheckInDate', '')
    }
  },

  // initCloud() {
  //   try {
  //     wx.cloud.init({ env: wx.cloud.DYNAMIC_CURRENT_ENV, traceUser: true })
  //     this.globalData.cloudReady = true
  //     this.syncCoins()
  //   } catch (e) {
  //     console.warn('云开发初始化失败', e)
  //   }
  // },

  // syncCoins() {
  //   wx.cloud.callFunction({
  //     name: 'login',
  //     timeout: 5000
  //   }).then(res => {
  //     const result = res.result
  //     if (result && result.openid) {
  //       this.globalData.openid = result.openid
  //     }
  //     if (result && result.coins) {
  //       wx.setStorageSync('awakeningCoins', result.coins)
  //     }
  //   }).catch(() => {})
  // }
})
