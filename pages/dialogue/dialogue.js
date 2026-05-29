const { generateReply, detectEmotion } = require('../../data/dialogue')

const DAILY_FREE_LIMIT = 5

Page({
  data: {
    phase: 'compose', // compose | sent | upgrade
    letterContent: '',
    sentLetter: '',
    reply: '',
    replyParts: [], // empathy messages shown one by one
    currentReplyIndex: -1,
    loading: false,
    detectedEmotion: null,
    recommendedPractice: null,
    dailyRemaining: DAILY_FREE_LIMIT,
    isPremium: false,
    showUpgrade: false,
    themeClass: 'theme-default'
  },

  onLoad() {
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ themeClass: 'theme-' + theme })
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

    // Check daily limit
    if (!this.data.isPremium && this.data.dailyRemaining <= 0) {
      this.setData({ showUpgrade: true })
      return
    }

    // Increment daily counter
    const count = (wx.getStorageSync('dailyMsgCount') || 0) + 1
    wx.setStorageSync('dailyMsgCount', count)

    const emotion = detectEmotion(text)

    // Build recommended practice based on emotion
    const practiceMap = {
      anxiety: { label: '4-7-8 呼吸 · 3 分钟', page: 'breath', params: 'pattern=478' },
      anger: { label: '箱式呼吸 · 4 分钟', page: 'breath', params: 'pattern=box' },
      low: { label: '身体扫描练习', page: 'practice' },
      tangled: { label: '观察思维练习', page: 'practice' }
    }
    const practice = practiceMap[emotion] || null

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

  startEmpathySequence() {
    const emotion = this.data.detectedEmotion
    const emotionLabel = emotion === 'anxiety' ? '焦虑' : emotion === 'anger' ? '愤怒' : emotion === 'low' ? '低落' : '纠结'

    // Empathy messages shown one by one
    const empathyMessages = [
      '我在看……',
      `我感受到你的「${emotionLabel}」了`,
      '让我想想怎么回你'
    ]

    this.setData({ replyParts: empathyMessages, currentReplyIndex: -1 })

    // Show each empathy message with delay
    empathyMessages.forEach((_, idx) => {
      setTimeout(() => {
        this.setData({ currentReplyIndex: idx })
        // On last empathy message, generate the actual reply
        if (idx === empathyMessages.length - 1) {
          setTimeout(() => this.generateReply(), 400)
        }
      }, idx * 700)
    })
  },

  generateReply() {
    const reply = generateReply([{ role: 'user', content: this.data.sentLetter }])
    this.setData({
      reply,
      loading: false
    })
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
    wx.navigateBack()
  }
})
