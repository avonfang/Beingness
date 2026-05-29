const util = require('../../utils/util')

Page({
  data: { list: [] },

  onShow() { this.loadEntries() },

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
      const date = util.formatDate(new Date(entry.createdAt))
      if (!grouped[date]) grouped[date] = { date, entries: [] }
      if (entry.type === 'dialogue') {
        grouped[date].entries.push({
          id: entry.id,
          type: 'dialogue',
          time: util.formatTime(new Date(entry.createdAt)),
          preview: entry.preview || '深度对话',
          messageCount: entry.messageCount
        })
      } else {
        grouped[date].entries.push({
          ...entry,
          time: util.formatTime(new Date(entry.createdAt)),
          emotionIcon: util.EMOTION_MAP[entry.emotionType]?.icon || '',
          emotionLabel: util.EMOTION_MAP[entry.emotionType]?.label || '',
          stars: entry.rating ? '★'.repeat(entry.rating) : ''
        })
      }
    })
    this.setData({ list: Object.values(grouped) })
  }
})
