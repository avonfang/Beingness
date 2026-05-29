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
  }
})
