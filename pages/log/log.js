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
      const ts = new Date(entry.createdAt)
      const date = util.formatDate(ts)
      if (!grouped[date]) grouped[date] = { date, entries: [] }
      if (entry.type === 'dialogue') {
        grouped[date].entries.push({
          id: entry.id,
          type: 'dialogue',
          time: util.formatTime(ts),
          preview: entry.preview || '深度对话',
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
  }
})
