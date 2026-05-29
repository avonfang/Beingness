App({
  globalData: {
    openid: '',
    userInfo: null,
    // 设为 true 启用云开发（需先注册小程序并部署云函数）
    cloudReady: false
  },

  onLaunch() {
    // 初始化觉醒币（本地存储）
    if (!wx.getStorageSync('awakeningCoins')) {
      wx.setStorageSync('awakeningCoins', 10)
    }

    // 云开发模式：取消注释以下代码
    // this.initCloud()
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
