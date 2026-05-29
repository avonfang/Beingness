const localReplies = [
  '我听到了。先停一下，深呼吸三次——然后告诉我，这个感受在你身体的哪个部位？',
  '你能退一步，看看那个在思考的「你」吗？那个注意到自己有这个想法的是谁？',
  '这个感觉像什么颜色？什么温度？不评判它，只是观察它。',
  '我不是你，但我在这里。你能告诉我，此刻最真实的身体感受是什么？',
  '把注意力放在脚底。感受地面。你在这里，你很安全。',
  '你不需要解决所有问题。这一刻，你只需要呼吸。',
  '念头来了又走了。像云一样。你不是云——你是看云的人。',
  '如果你能听到你脑子里那个声音，那说明你不是那个声音。你是听到声音的人。'
]

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    coins: 0,
    scrollTarget: ''
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
    wx.setStorageSync('dialogueHistory', history.slice(0, 50)) // 保留最近 50 条
  },

  sendMessage() {
    const text = this.data.inputValue.trim()
    if (!text || this.data.loading || this.data.coins < 3) return

    const newMsg = { role: 'user', content: text }
    const messages = [...this.data.messages, newMsg]

    this.setData({
      messages,
      inputValue: '',
      loading: true
    })

    this.scrollToBottom()
    setTimeout(() => this.localReply(text), 100)
  },

  localReply(userText) {
    const idx = userText.length % localReplies.length
    const reply = localReplies[idx]
    const newCoins = this.data.coins - 3
    wx.setStorageSync('awakeningCoins', newCoins)
    setTimeout(() => {
      this.setData({
        messages: [...this.data.messages, { role: 'assistant', content: reply }],
        loading: false,
        coins: newCoins
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
