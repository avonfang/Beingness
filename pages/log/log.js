const util = require('../../utils/util')

Page({
  data: { list: [], isPremium: false, themeClass: 'theme-default' },

  onShow() {
    const theme = wx.getStorageSync('appTheme') || 'default'
    const isPremium = wx.getStorageSync('isPremium') || false
    this.setData({ themeClass: 'theme-' + theme, isPremium })
    this.loadEntries()
  },

  loadEntries() {
    const entries = wx.getStorageSync('pendingEntries') || []
    const dialogues = wx.getStorageSync('dialogueHistory') || []
    const all = [...entries, ...dialogues]

    if (!all.length) {
      this.setData({ list: [] })
      return
    }

    const grouped = {}
    all.forEach(entry => {
      const ts = new Date(entry.createdAt)
      const date = util.formatDate(ts)
      if (!grouped[date]) grouped[date] = { date, entries: [] }
      if (entry.type === 'dialogue') {
        grouped[date].entries.push({
          id: entry.id,
          type: 'dialogue',
          time: util.formatTime(ts),
          preview: entry.preview || '此刻信箱',
          messageCount: entry.messageCount,
          _sort: ts.getTime()
        })
      } else {
        grouped[date].entries.push({
          ...entry,
          time: util.formatTime(ts),
          emotionIcon: util.EMOTION_MAP[entry.emotionType]?.icon || '',
          emotionLabel: util.EMOTION_MAP[entry.emotionType]?.label || '',
          stars: entry.rating ? '★'.repeat(entry.rating) : '',
          _sort: ts.getTime()
        })
      }
      // Newest first within each day
      grouped[date].entries.sort((a, b) => b._sort - a._sort)
    })
    this.setData({ list: Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)) })
  },

  goEmergency() {
    wx.navigateTo({ url: '/pages/emergency/emergency' })
  },

  goBreath() {
    wx.navigateTo({ url: '/pages/breath/breath' })
  },

  buyPremium() {
    wx.showModal({
      title: '此刻 · 陪伴',
      content: '¥9.9/月 — 无限使用此刻信箱 · 高级呼吸模式 · 每周专属练习\n\n微信支付开通后即可订阅。点击确认模拟激活 30 天。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('isPremium', true)
          this.setData({ isPremium: true })
          wx.showToast({ title: '此刻 · 陪伴已激活 ✓', icon: 'success' })
        }
      }
    })
  }
})
