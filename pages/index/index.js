const { getDailyPractice } = require('../../data/dailies')

const EMOTION_TAGS = [
  { value: 'anxiety', label: '焦虑', icon: '😰' },
  { value: 'anger', label: '愤怒', icon: '😤' },
  { value: 'low', label: '低落', icon: '😔' },
  { value: 'tangled', label: '纠结', icon: '😵‍💫' }
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
    awakeningCoins: 0,
    hasSeenOnboarding: false,
    streakDays: 0,
    recommendation: null,
    dailyPractice: null,
    isPremium: false,
    themeClass: 'theme-default',
    showEmotionTags: true
  },

  onLoad() {
    const hasSeen = wx.getStorageSync('hasSeenOnboarding') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    const tagUses = wx.getStorageSync('emotionTagUses') || 0
    this.setData({
      hasSeenOnboarding: hasSeen,
      dailyPractice: getDailyPractice(),
      themeClass: 'theme-' + theme,
      showEmotionTags: tagUses < 3
    })
  },

  onShow() {
    const coins = wx.getStorageSync('awakeningCoins') || 0
    const streakDays = wx.getStorageSync('streakDays') || 0
    const isPremium = wx.getStorageSync('isPremium') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ awakeningCoins: coins, streakDays, isPremium, themeClass: 'theme-' + theme })

    this.loadRecommendation()
    this.tryAutoCheckIn()
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

    const course = require('../../data/courses')
    const lesson = course[recommendation.path]?.lessons[recommendation.lessonIndex]
    if (!lesson) return

    const completed = wx.getStorageSync(`lesson_${recommendation.path}_${lesson.id}`) || false
    if (completed) return

    this.setData({ recommendation })
  },

  // Auto check-in silently when user opens app on a new day
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

    // Check milestone bonus
    let bonus = 0
    if (streakDays === 3) bonus = 5
    else if (streakDays === 7) bonus = 10
    else if (streakDays === 30) bonus = 30
    if (bonus > 0) {
      const coins = wx.getStorageSync('awakeningCoins') || 0
      wx.setStorageSync('awakeningCoins', coins + bonus)
    }

    this.setData({
      streakDays,
      awakeningCoins: wx.getStorageSync('awakeningCoins') || 0
    })

    // Quiet notification — no modal, just a subtle toast
    if (bonus > 0) {
      wx.showToast({
        title: `🔥 连续 ${streakDays} 天 · 奖励 ${bonus} 心意`,
        icon: 'none',
        duration: 2000
      })
    }
  },

  // Emotion tag tapped → navigate to emergency with pre-selected emotion
  onEmotionSelect(e) {
    const emotion = e.currentTarget.dataset.emotion
    wx.vibrateShort({ type: 'light' }).catch(() => {})

    // Track usage count — hide tags after 3 uses
    const tagUses = (wx.getStorageSync('emotionTagUses') || 0) + 1
    wx.setStorageSync('emotionTagUses', tagUses)
    if (tagUses >= 3) {
      this.setData({ showEmotionTags: false })
    }

    // Navigate to emergency with emotion pre-selected
    wx.navigateTo({
      url: `/pages/emergency/emergency?emotion=${emotion}`
    })
  },

  goRecommendLesson() {
    const rec = this.data.recommendation
    if (!rec) return
    wx.navigateTo({
      url: `/pages/learning/lesson/lesson?path=${rec.path}&lessonIndex=${rec.lessonIndex}`
    })
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
