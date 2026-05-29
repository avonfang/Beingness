const util = require('../../utils/util')

Page({
  data: { list: [] },

  onShow() { this.loadEntries() },

  loadEntries() {
    const db = wx.cloud.database()
    db.collection('moodEntries').orderBy('createdAt', 'desc').limit(50).get().then(res => {
      const grouped = {}
      res.data.forEach(entry => {
        const date = util.formatDate(new Date(entry.createdAt))
        if (!grouped[date]) grouped[date] = { date, entries: [] }
        grouped[date].entries.push({
          _id: entry._id,
          ...entry,
          time: util.formatTime(new Date(entry.createdAt)),
          emotionIcon: util.EMOTION_MAP[entry.emotionType]?.icon || '',
          emotionLabel: util.EMOTION_MAP[entry.emotionType]?.label || ''
        })
      })
      this.setData({ list: Object.values(grouped) })
    }).catch(() => {
      // 离线：读取本地缓存
      const pending = wx.getStorageSync('pendingEntries') || []
      if (pending.length) {
        const grouped = {}
        pending.forEach(entry => {
          const date = util.formatDate(new Date(entry.createdAt))
          if (!grouped[date]) grouped[date] = { date, entries: [] }
          grouped[date].entries.push({
            ...entry,
            time: util.formatTime(new Date(entry.createdAt)),
            emotionIcon: util.EMOTION_MAP[entry.emotionType]?.icon || '',
            emotionLabel: util.EMOTION_MAP[entry.emotionType]?.label || ''
          })
        })
        this.setData({ list: Object.values(grouped) })
      }
    })
  }
})
