const { getDailyPractice } = require('../../data/dailies')

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

const RECOMMENDATIONS = {
  anxiety: {
    title: '今日推荐：缓解焦虑',
    desc: '你最近的急救以焦虑为主，推荐学习「临在之路」第2课',
    action: '回到身体',
    path: 'presence',
    lessonIndex: 1
  },
  anger: {
    title: '今日推荐：化解愤怒',
    desc: '愤怒往往来自抗拒。推荐学习「臣服之路」第2课',
    action: '观察内在抗拒',
    path: 'surrender',
    lessonIndex: 1
  },
  low: {
    title: '今日推荐：释放低落',
    desc: '低落的能量需要流动。推荐学习「开放之路」第2课',
    action: '感受的流动',
    path: 'openness',
    lessonIndex: 1
  },
  tangled: {
    title: '今日推荐：放下纠结',
    desc: '纠结时试试臣服。推荐学习「臣服之路」第3课',
    action: '放手与信任',
    path: 'surrender',
    lessonIndex: 2
  }
}

Page({
  data: {
    dailyQuote: '',
    awakeningCoins: 0,
    hasSeenOnboarding: false,
    showCheckIn: false,
    streakDays: 0,
    recommendation: null,
    dailyPractice: null,
    isPremium: false,
    themeClass: 'theme-default'
  },

  onLoad() {
    const today = new Date().getDate()
    const hasSeen = wx.getStorageSync('hasSeenOnboarding') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({
      dailyQuote: quotes[today % quotes.length],
      hasSeenOnboarding: hasSeen,
      dailyPractice: getDailyPractice(),
      themeClass: 'theme-' + theme
    })
  },

  onShow() {
    const coins = wx.getStorageSync('awakeningCoins') || 0
    const streakDays = wx.getStorageSync('streakDays') || 0
    const isPremium = wx.getStorageSync('isPremium') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ awakeningCoins: coins, streakDays, isPremium, themeClass: 'theme-' + theme })

    this.checkDailyCheckIn()
    this.loadRecommendation()
  },

  loadRecommendation() {
    const entries = wx.getStorageSync('pendingEntries') || []
    if (entries.length === 0) return

    const recent = entries.slice(-5)
    const counts = {}
    recent.forEach(e => { counts[e.emotionType] = (counts[e.emotionType] || 0) + 1 })

    let maxEmotion = null, maxCount = 0
    for (const [type, count] of Object.entries(counts)) {
      if (count > maxCount) { maxCount = count; maxEmotion = type }
    }

    const recommendation = RECOMMENDATIONS[maxEmotion]
    if (!recommendation) return

    // Check if already completed this lesson
    const course = require('../../data/courses')
    const lesson = course[recommendation.path]?.lessons[recommendation.lessonIndex]
    if (!lesson) return

    const completed = wx.getStorageSync(`lesson_${recommendation.path}_${lesson.id}`) || false
    if (completed) return // Already completed, don't recommend

    this.setData({ recommendation })
  },

  goRecommendLesson() {
    const rec = this.data.recommendation
    if (!rec) return
    wx.navigateTo({
      url: `/pages/learning/lesson/lesson?path=${rec.path}&lessonIndex=${rec.lessonIndex}`
    })
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

    const nextMilestone = streakDays < 3 ? 3 - streakDays : streakDays < 7 ? 7 - streakDays : streakDays < 30 ? 30 - streakDays : 0
    let msg = `签到成功 · 连续 ${streakDays} 天`
    if (bonus > 0) msg += `\n里程碑奖励 +${bonus} 觉醒币 ✦`
    if (nextMilestone > 0) msg += `\n再签到 ${nextMilestone} 天到达下个里程碑`
    wx.showToast({ title: msg, icon: 'none', duration: 2500 })
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
  },

  goBreath() {
    wx.navigateTo({ url: '/pages/breath/breath' })
  },

  goDailyPractice() {
    const p = this.data.dailyPractice
    if (!p) return

    // Premium gate
    if (p.premium) {
      const isPremium = wx.getStorageSync('isPremium') || false
      if (!isPremium) {
        wx.showModal({
          title: '高级内容',
          content: '今日练习为无限版专属内容。升级后即可解锁全部练习。',
          confirmText: '查看升级',
          cancelText: '稍后',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/profile/profile' })
            }
          }
        })
        return
      }
    }

    wx.navigateTo({
      url: `/pages/learning/lesson/lesson?path=${p.pathKey}&lessonIndex=${p.lessonIndex}`
    })
  }
})
