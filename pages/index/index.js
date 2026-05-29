const quotes = [
  '你不是你的情绪——你是观察者。',
  '当下是你唯一真正拥有的东西。',
  '痛苦只能存在于当下，但它无法存在于当下——这是个悖论。',
  '你不是那片云，你是看云的人。',
  '当你与思维认同时，你找到了暂时的避难所，却失去了永久的平静。',
  '臣服不是放弃，而是放下对"此刻"的抗拒。',
  '内心的能量如果不被阻塞，它就是生命的喜悦。',
  '问题只存在于时间中。在当下，它不存在。',
  '自由不是控制你的想法，而是不再被它们控制。',
  '在观察者的位置，万事万物都顺其自然。'
]

Page({
  data: {
    dailyQuote: '',
    awakeningCoins: 0,
    hasSeenOnboarding: false,
    showCheckIn: false,
    streakDays: 0
  },

  onLoad() {
    const today = new Date().getDate()
    const hasSeen = wx.getStorageSync('hasSeenOnboarding') || false
    this.setData({
      dailyQuote: quotes[today % quotes.length],
      hasSeenOnboarding: hasSeen
    })
  },

  onShow() {
    const coins = wx.getStorageSync('awakeningCoins') || 0
    const streakDays = wx.getStorageSync('streakDays') || 0
    this.setData({ awakeningCoins: coins, streakDays })

    this.checkDailyCheckIn()
  },

  checkDailyCheckIn() {
    const lastDate = wx.getStorageSync('lastCheckInDate') || ''
    const today = new Date().toLocaleDateString('zh-CN')
    if (lastDate !== today) {
      this.setData({ showCheckIn: true })
    }
  },

  doCheckIn() {
    const lastDate = wx.getStorageSync('lastCheckInDate') || ''
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN')
    const today = new Date().toLocaleDateString('zh-CN')

    let streakDays = wx.getStorageSync('streakDays') || 0
    if (lastDate === yesterday) {
      streakDays += 1
    } else {
      streakDays = 1
    }

    wx.setStorageSync('lastCheckInDate', today)
    wx.setStorageSync('streakDays', streakDays)

    const coins = wx.getStorageSync('awakeningCoins') || 0

    let bonus = 0
    if (streakDays === 3) bonus = 5
    else if (streakDays === 7) bonus = 10
    else if (streakDays === 30) bonus = 30
    if (bonus > 0) {
      wx.setStorageSync('awakeningCoins', coins + bonus)
    }

    this.setData({
      showCheckIn: false,
      streakDays,
      awakeningCoins: wx.getStorageSync('awakeningCoins') || 0
    })

    let msg = `签到成功 · 连续 ${streakDays} 天`
    if (bonus > 0) msg += `\n里程碑奖励 +${bonus} 觉醒币 ✦`
    wx.showToast({ title: msg, icon: 'none', duration: 2000 })
  },

  skipCheckIn() {
    this.setData({ showCheckIn: false })
  },

  onOnboardingFinish() {
    this.setData({ hasSeenOnboarding: true })
  },

  startEmergency() {
    wx.navigateTo({ url: '/pages/emergency/emergency' })
  },

  goDialogue() {
    wx.navigateTo({ url: '/pages/dialogue/dialogue' })
  },

  goLearning() {
    wx.switchTab({ url: '/pages/learning/learning' })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  }
})
