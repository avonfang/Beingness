const { generateReply, detectEmotion } = require('../../data/dialogue')

const DAILY_FREE_LIMIT = 5

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    scrollTarget: '',
    detectedEmotion: null,
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

  onHide() {
    this.saveDialogue()
  },

  goBack() {
    this.saveDialogue()
    wx.navigateBack()
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value })
  },

  saveDialogue() {
    const msgs = this.data.messages
    if (msgs.length === 0) return

    const history = wx.getStorageSync('dialogueHistory') || []
    const firstMsg = msgs.find(m => m.role === 'user')
    history.unshift({
      id: Date.now(),
      type: 'dialogue',
      messageCount: msgs.length,
      preview: firstMsg ? firstMsg.content.slice(0, 40) : '',
      createdAt: new Date().toISOString()
    })
    wx.setStorageSync('dialogueHistory', history.slice(0, 50))
  },

  sendQuickMsg(e) {
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    const msg = e.currentTarget.dataset.msg
    this.setData({ inputValue: msg })
    this.sendMessage()
  },

  checkDailyLimit() {
    const today = new Date().toLocaleDateString('zh-CN')
    const lastDate = wx.getStorageSync('dailyMsgDate') || ''
    const isPremium = wx.getStorageSync('isPremium') || false

    if (lastDate !== today) {
      // New day, reset counter
      wx.setStorageSync('dailyMsgDate', today)
      wx.setStorageSync('dailyMsgCount', 0)
      this.setData({ dailyRemaining: DAILY_FREE_LIMIT, isPremium, showUpgrade: false })
    } else {
      const count = wx.getStorageSync('dailyMsgCount') || 0
      const remaining = isPremium ? 999 : Math.max(0, DAILY_FREE_LIMIT - count)
      this.setData({ dailyRemaining: remaining, isPremium, showUpgrade: remaining <= 0 && !isPremium })
    }
  },

  sendMessage() {
    const text = this.data.inputValue.trim()
    if (!text || this.data.loading) return

    // Check daily limit
    if (!this.data.isPremium && this.data.dailyRemaining <= 0) {
      this.setData({ showUpgrade: true })
      return
    }

    // Increment daily counter
    const count = (wx.getStorageSync('dailyMsgCount') || 0) + 1
    wx.setStorageSync('dailyMsgCount', count)

    const newMsg = { role: 'user', content: text }
    const messages = [...this.data.messages, newMsg]

    const emotion = detectEmotion(text)

    this.setData({
      messages,
      inputValue: '',
      loading: true,
      detectedEmotion: emotion,
      dailyRemaining: this.data.isPremium ? 999 : Math.max(0, DAILY_FREE_LIMIT - count)
    })

    this.scrollToBottom()
    setTimeout(() => this.localReply(text), 400)
  },

  localReply(userText) {
    const reply = generateReply(this.data.messages)
    setTimeout(() => {
      this.setData({
        messages: [...this.data.messages, { role: 'assistant', content: reply }],
        loading: false,
        detectedEmotion: null
      })
      this.scrollToBottom()
    }, 800)
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTarget: 'scroll-bottom' })
    }, 150)
  }
})
