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

  loadCoins() {
    const coins = wx.getStorageSync('awakeningCoins')
    if (typeof coins === 'number') {
      this.setData({ coins })
    }
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value })
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

    // 调用云函数
    wx.cloud.callFunction({
      name: 'deep-dialogue',
      data: {
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      }
    }).then(res => {
      const result = res.result
      if (result.code === 0) {
        this.setData({
          messages: [...this.data.messages, { role: 'assistant', content: result.reply }],
          loading: false,
          coins: result.coinsRemaining
        })
        wx.setStorageSync('awakeningCoins', result.coinsRemaining)
      } else if (result.code === 403) {
        wx.showToast({ title: result.error || '觉醒币不足', icon: 'none' })
        this.setData({
          loading: false,
          coins: result.coins || 0
        })
      } else {
        wx.showToast({ title: result.error || '对话失败，请重试', icon: 'none' })
        this.setData({ loading: false })
      }
      this.scrollToBottom()
    }).catch(err => {
      wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      this.setData({ loading: false })
    })
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTarget: 'scroll-bottom' })
    }, 100)
  }
})
