const { getDailyPractice } = require('../../data/dailies')

const EMOTION_TAGS = [
  { value: 'anxiety', label: '焦虑', icon: '😰' },
  { value: 'anger', label: '愤怒', icon: '😤' },
  { value: 'low', label: '低落', icon: '😔' },
  { value: 'tangled', label: '纠结', icon: '😵‍💫' }
]

const RECOMMENDATIONS = {
  anxiety: [
    { title: '缓解焦虑 · 回到身体', desc: '焦虑时最需要的是从思维回到身体', path: 'presence', lessonIndex: 1 },
    { title: '缓解焦虑 · 你≠你的思维', desc: '看清焦虑的来源——你与思维不是一回事', path: 'presence', lessonIndex: 0 }
  ],
  anger: [
    { title: '化解愤怒 · 观察内在抗拒', desc: '愤怒往往来自抗拒，看到它就能放下它', path: 'surrender', lessonIndex: 1 },
    { title: '化解愤怒 · 什么是臣服', desc: '真正的臣服不是认输，是放下内心战争', path: 'surrender', lessonIndex: 0 }
  ],
  low: [
    { title: '释放低落 · 感受的流动', desc: '低落的能量需要流动，允许它经过你', path: 'openness', lessonIndex: 1 },
    { title: '释放低落 · 回到身体', desc: '身体永远在当下，低落时回到身体感受', path: 'presence', lessonIndex: 1 }
  ],
  tangled: [
    { title: '放下纠结 · 放手与信任', desc: '纠结的解药是松开紧握的拳头', path: 'surrender', lessonIndex: 2 },
    { title: '放下纠结 · 在当下找到力量', desc: '问题只存在于时间里，回到当下', path: 'presence', lessonIndex: 4 }
  ]
}

const FALLBACK_RECS = [
  { title: '开始觉醒 · 你≠你的思维', desc: '一切觉醒的起点——认出你不是头脑里的声音', path: 'presence', lessonIndex: 0 },
  { title: '开始觉醒 · 回到身体', desc: '最快速的回到当下的方法', path: 'presence', lessonIndex: 1 }
]

Page({
  data: {
    awakeningCoins: 0,
    hasSeenOnboarding: false,
    streakDays: 0,
    recommendation: null,
    dailyPractice: null,
    isPremium: false,
    themeClass: 'theme-default',
    showEmotionTags: true,
    showTransitionGuide: false
  },

  onLoad() {
    const hasSeen = wx.getStorageSync('hasSeenOnboarding') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    const streakDays = wx.getStorageSync('streakDays') || 0
    const hasSeenV5Guide = wx.getStorageSync('hasSeenV5Guide') || false

    this.setData({
      hasSeenOnboarding: hasSeen,
      dailyPractice: getDailyPractice(),
      themeClass: 'theme-' + theme,
      showTransitionGuide: hasSeen && !hasSeenV5Guide,
      streakDays
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
    this.checkLastMood()
  },

  // Mood continuity: if user felt worse after last letter, check in
  checkLastMood() {
    const records = wx.getStorageSync('moodAfterLetter') || []
    if (records.length === 0) return

    const last = records[0]
    if (last.mood !== 'worse') return

    const hoursSince = (Date.now() - last.timestamp) / 3600000
    if (hoursSince > 48) return // Only prompt within 48h

    // Don't show if already prompted today
    const prompted = wx.getStorageSync('moodFollowUpDate') || ''
    const today = new Date().toLocaleDateString('zh-CN')
    if (prompted === today) return

    setTimeout(() => {
      wx.showModal({
        title: '💛 上次你写信时，说感觉不太好',
        content: '今天那件事想起来，感觉怎么样了？',
        confirmText: '😊 好些了',
        cancelText: '😔 还那样',
        success: (res) => {
          wx.setStorageSync('moodFollowUpDate', today)
          const followUps = wx.getStorageSync('moodFollowUps') || []
          followUps.push({
            improved: res.confirm,
            timestamp: Date.now()
          })
          wx.setStorageSync('moodFollowUps', followUps.slice(-50))
        }
      })
    }, 1000)
  },

  loadRecommendation() {
    const course = require('../../data/courses')

    // Gather all emotion signals
    const emotionScores = {}

    // Score from emergency entries (weight: 2 per entry)
    const entries = wx.getStorageSync('pendingEntries') || []
    entries.slice(-10).forEach(e => {
      if (e.emotionType) emotionScores[e.emotionType] = (emotionScores[e.emotionType] || 0) + 2
    })

    // Score from dialogues (weight: 1 per dialogue)
    const dialogues = wx.getStorageSync('dialogueHistory') || []
    dialogues.slice(0, 10).forEach(d => {
      if (d.emotion) emotionScores[d.emotion] = (emotionScores[d.emotion] || 0) + 1
    })

    // Find dominant emotion
    let maxEmotion = null, maxScore = 0
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) { maxScore = score; maxEmotion = emotion }
    }

    // Build completed set
    const completedLessons = {}
    ;['presence', 'surrender', 'openness'].forEach(p => {
      const c = course[p]
      if (!c) return
      c.lessons.forEach(l => {
        if (wx.getStorageSync(`lesson_${p}_${l.id}`)) completedLessons[l.id] = true
      })
    })

    // Pick first uncompleted recommendation
    const candidates = (maxEmotion ? RECOMMENDATIONS[maxEmotion] : null) || FALLBACK_RECS
    for (const rec of candidates) {
      const lesson = course[rec.path]?.lessons[rec.lessonIndex]
      if (!lesson) continue
      if (!completedLessons[lesson.id]) {
        this.setData({ recommendation: rec })
        return
      }
    }

    // All recommended lessons completed — clear recommendation
    this.setData({ recommendation: null })
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
      const { addCoins } = require('../../utils/coins')
      addCoins(bonus, `连续 ${streakDays} 天里程碑`)
    }

    this.setData({
      streakDays,
      awakeningCoins: wx.getStorageSync('awakeningCoins') || 0
    })

    // Quiet notification
    if (bonus > 0) {
      wx.showToast({
        title: `🔥 连续 ${streakDays} 天 · 奖励 ${bonus} 心意`,
        icon: 'none',
        duration: 2000
      })
    }
  },

  // Emotion tag tapped → show 3 options
  onEmotionSelect(e) {
    const emotion = e.currentTarget.dataset.emotion
    wx.vibrateShort({ type: 'light' }).catch(() => {})

    // Let user choose what to do with this emotion
    const self = this
    wx.showActionSheet({
      itemList: ['🧘 做一次情绪急救', '💌 写一封信给自己', '🌬️ 先做一组呼吸'],
      success(res) {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: `/pages/emergency/emergency?emotion=${emotion}` })
        } else if (res.tapIndex === 1) {
          wx.navigateTo({ url: '/pages/dialogue/dialogue' })
        } else {
          wx.navigateTo({ url: '/pages/breath/breath' })
        }
      }
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

  onTransitionFinish() {
    this.setData({ showTransitionGuide: false })
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
