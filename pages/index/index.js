Page({
  data: {
    hasSeenOnboarding: false,
    showTransitionGuide: false,
    streakDays: 0,
    isPremium: false,
    themeClass: 'theme-default'
  },

  onLoad() {
    const hasSeen = wx.getStorageSync('hasSeenOnboarding') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    const streakDays = wx.getStorageSync('streakDays') || 0
    const hasSeenV5Guide = wx.getStorageSync('hasSeenV5Guide') || false

    this.setData({
      hasSeenOnboarding: hasSeen,
      themeClass: 'theme-' + theme,
      showTransitionGuide: hasSeen && !hasSeenV5Guide,
      streakDays
    })
  },

  onShow() {
    const streakDays = wx.getStorageSync('streakDays') || 0
    const isPremium = wx.getStorageSync('isPremium') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ streakDays, isPremium, themeClass: 'theme-' + theme })
    this.tryAutoCheckIn()
  },

  // Randomly pick an activity
  startSession() {
    const activities = [
      () => this.goBreath(),
      () => this.goDialogue(),
      () => this.startEmergency()
    ]
    const pick = activities[Math.floor(Math.random() * activities.length)]
    pick()
  },

  tryAutoCheckIn() {
    const lastDate = wx.getStorageSync('lastCheckInDate') || ''
    const today = new Date().toLocaleDateString('zh-CN')
    if (lastDate === today) return

    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN')
    let streakDays = wx.getStorageSync('streakDays') || 0
    if (lastDate === yesterday) {
      streakDays += 1
    } else {
      streakDays = 1
    }

    wx.setStorageSync('lastCheckInDate', today)
    wx.setStorageSync('streakDays', streakDays)
    this.setData({ streakDays })
  },

  goBreath() {
    wx.navigateTo({ url: '/pages/breath/breath' })
  },

  goDialogue() {
    wx.navigateTo({ url: '/pages/dialogue/dialogue' })
  },

  startEmergency() {
    wx.navigateTo({ url: '/pages/emergency/emergency' })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  onOnboardingFinish() {
    this.setData({ hasSeenOnboarding: true })
  },

  onTransitionFinish() {
    this.setData({ showTransitionGuide: false })
  }
})
