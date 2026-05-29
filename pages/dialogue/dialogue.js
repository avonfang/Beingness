const { generateReply, detectEmotion } = require('../../data/dialogue')

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    coins: 0,
    scrollTarget: '',
    detectedEmotion: null
  },

  onLoad() {
    this.loadCoins()
  },

  onHide() {
    this.saveDialogue()
  },

  goBack() {
    this.saveDialogue()
    wx.navigateBack()
  },

  loadCoins() {
    const coins = wx.getStorageSync('awakeningCoins')
    if (typeof coins === 'number') {
      this.setData({ coins })
    }
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
    const msg = e.currentTarget.dataset.msg
    this.setData({ inputValue: msg })
    this.sendMessage()
  },

  sendMessage() {
    const text = this.data.inputValue.trim()
    if (!text || this.data.loading || this.data.coins < 3) return

    this.data.coins -= 3
    wx.setStorageSync('awakeningCoins', this.data.coins)

    const newMsg = { role: 'user', content: text }
    const messages = [...this.data.messages, newMsg]

    // Detect emotion for UI feedback
    const emotion = detectEmotion(text)

    this.setData({
      messages,
      inputValue: '',
      loading: true,
      coins: this.data.coins,
      detectedEmotion: emotion
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
