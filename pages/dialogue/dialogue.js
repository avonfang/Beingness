const DAILY_FREE_LIMIT = 5

Page({
  data: {
    phase: 'compose', // compose | sent | upgrade | checkMood
    letterContent: '',
    sentLetter: '',
    reply: '',
    replyParts: [],
    currentReplyIndex: -1,
    loading: false,
    detectedEmotion: null,
    recommendedPractice: null,
    dailyRemaining: DAILY_FREE_LIMIT,
    isPremium: false,
    showUpgrade: false,
    themeClass: 'theme-default',
    showGuideText: true
  },

  onLoad() {
    const theme = wx.getStorageSync('appTheme') || 'default'

    // Check if user has written letters before — hide guide text if yes
    const history = wx.getStorageSync('dialogueHistory') || []
    this.setData({
      themeClass: 'theme-' + theme,
      showGuideText: history.length === 0
    })
    this.checkDailyLimit()
  },

  onShow() {
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ themeClass: 'theme-' + theme })
  },

  onInput(e) {
    this.setData({ letterContent: e.detail.value })
  },

  sendQuickMsg(e) {
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    const msg = e.currentTarget.dataset.msg
    this.setData({ letterContent: msg })
    this.sendLetter()
  },

  checkDailyLimit() {
    const today = new Date().toLocaleDateString('zh-CN')
    const lastDate = wx.getStorageSync('dailyMsgDate') || ''
    const isPremium = wx.getStorageSync('isPremium') || false

    if (lastDate !== today) {
      wx.setStorageSync('dailyMsgDate', today)
      wx.setStorageSync('dailyMsgCount', 0)
      this.setData({ dailyRemaining: DAILY_FREE_LIMIT, isPremium, showUpgrade: false })
    } else {
      const count = wx.getStorageSync('dailyMsgCount') || 0
      const remaining = isPremium ? 999 : Math.max(0, DAILY_FREE_LIMIT - count)
      this.setData({ dailyRemaining: remaining, isPremium, showUpgrade: remaining <= 0 && !isPremium })
    }
  },

  sendLetter() {
    const text = this.data.letterContent.trim()
    if (!text || this.data.loading) return

    if (!this.data.isPremium && this.data.dailyRemaining <= 0) {
      this.setData({ showUpgrade: true })
      return
    }

    const count = (wx.getStorageSync('dailyMsgCount') || 0) + 1
    wx.setStorageSync('dailyMsgCount', count)

    // Use cached dialogue module from app
    const { detectEmotion } = getApp().globalData.dialogueModule
    const emotion = detectEmotion(text)

    const practice = this.getSmartRecommendation(emotion)

    this.setData({
      phase: 'sent',
      sentLetter: text,
      letterContent: '',
      loading: true,
      detectedEmotion: emotion,
      reply: '',
      replyParts: [],
      currentReplyIndex: -1,
      recommendedPractice: practice,
      dailyRemaining: this.data.isPremium ? 999 : Math.max(0, DAILY_FREE_LIMIT - count)
    })

    this.saveLetter(text)
    this.startEmpathySequence()
  },

  // Personalized practice recommendation based on user's history
  getSmartRecommendation(emotion) {
    const stats = wx.getStorageSync('emotionPracticeStats') || {}
    const emotionStats = stats[emotion]

    // Default recommendations
    const defaultMap = {
      anxiety: { label: '4-7-8 呼吸 · 3 分钟', page: 'breath' },
      anger: { label: '箱式呼吸 · 4 分钟', page: 'breath' },
      low: { label: '身体扫描练习', page: 'practice' },
      tangled: { label: '观察思维练习', page: 'practice' }
    }

    if (!emotionStats) return defaultMap[emotion] || null

    // Recommend what user does most frequently for this emotion
    const breathCount = emotionStats.breath || 0
    const practiceCount = emotionStats.practice || 0

    if (breathCount >= practiceCount) {
      if (emotion === 'anxiety') return { label: '4-7-8 呼吸 · 3 分钟', page: 'breath' }
      if (emotion === 'anger') return { label: '箱式呼吸 · 4 分钟', page: 'breath' }
      return { label: '478 呼吸 · 3 分钟', page: 'breath' }
    } else {
      if (emotion === 'low') return { label: '身体扫描练习', page: 'practice' }
      if (emotion === 'tangled') return { label: '观察思维练习', page: 'practice' }
      return { label: '回到身体练习', page: 'practice' }
    }
  },

  startEmpathySequence() {
    const emotion = this.data.detectedEmotion
    const emotionLabel = emotion === 'anxiety' ? '焦虑' : emotion === 'anger' ? '愤怒' : emotion === 'low' ? '低落' : '纠结'

    const empathyMessages = [
      '我在看……',
      `我感受到你的「${emotionLabel}」了`,
      '让我想想怎么回你'
    ]

    this.setData({ replyParts: empathyMessages, currentReplyIndex: -1 })

    empathyMessages.forEach((_, idx) => {
      setTimeout(() => {
        this.setData({ currentReplyIndex: idx })
        if (idx === empathyMessages.length - 1) {
          setTimeout(() => this.generateReply(), 400)
        }
      }, idx * 700)
    })
  },

  generateReply() {
    const { generateReply } = getApp().globalData.dialogueModule
    const reply = generateReply([{ role: 'user', content: this.data.sentLetter }])
    this.setData({ reply, loading: false })
  },

  saveLetter(text) {
    const history = wx.getStorageSync('dialogueHistory') || []
    history.unshift({
      id: Date.now(),
      type: 'letter',
      messageCount: 1,
      preview: text.slice(0, 40),
      createdAt: new Date().toISOString()
    })
    wx.setStorageSync('dialogueHistory', history.slice(0, 50))
  },

  goPractice() {
    const practice = this.data.recommendedPractice
    if (!practice) return

    // Track practice usage for personalized recommendation
    const emotion = this.data.detectedEmotion
    if (emotion) {
      const stats = wx.getStorageSync('emotionPracticeStats') || {}
      if (!stats[emotion]) stats[emotion] = { breath: 0, practice: 0 }
      if (practice.page === 'breath') stats[emotion].breath++
      else stats[emotion].practice++
      wx.setStorageSync('emotionPracticeStats', stats)
    }

    if (practice.page === 'breath') {
      wx.navigateTo({ url: '/pages/breath/breath' })
    } else {
      wx.navigateTo({ url: '/pages/practice/practice' })
    }
  },

  writeAnother() {
    this.setData({
      phase: 'compose',
      sentLetter: '',
      reply: '',
      replyParts: [],
      currentReplyIndex: -1,
      detectedEmotion: null,
      recommendedPractice: null
    })
  },

  goBack() {
    // Mood check: how does user feel now?
    wx.showActionSheet({
      itemList: ['😊 好多了', '😐 差不多', '😔 还是不太好'],
      success: (res) => {
        const moodMap = { 0: 'better', 1: 'same', 2: 'worse' }
        const mood = moodMap[res.tapIndex]

        // Record mood change data
        const records = wx.getStorageSync('moodAfterLetter') || []
        records.push({
          emotion: this.data.detectedEmotion,
          mood,
          timestamp: Date.now()
        })
        wx.setStorageSync('moodAfterLetter', records.slice(-50))

        if (mood === 'better') {
          wx.showToast({ title: '很高兴能陪你 🤍', icon: 'none', duration: 1500 })
        }
        setTimeout(() => wx.navigateBack(), 500)
      },
      fail: () => {
        wx.navigateBack()
      }
    })
  }
})
