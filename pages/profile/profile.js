const util = require('../../utils/util')
const report = require('../../utils/report')

Page({
  data: {
    streakDays: 0,
    totalSessions: 0,
    avgRecovery: 0,
    totalLessons: 0,
    awakeningCoins: 0,
    emotionDistribution: [],
    insight: '加载中...'
  },

  onShow() { this.loadReport() },

  loadReport() {
    const db = wx.cloud.database()
    db.collection('moodEntries').orderBy('createdAt', 'desc').limit(100).get().then(res => {
      const entries = res.data
      const totalSessions = entries.length
      const avgRecovery = entries.length
        ? Math.round(entries.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / entries.length)
        : 0

      const counts = {}
      entries.forEach(e => { counts[e.emotionType] = (counts[e.emotionType] || 0) + 1 })
      const maxCount = Math.max(...Object.values(counts), 1)
      const emotionDistribution = Object.entries(counts).map(([type, count]) => ({
        type,
        label: util.EMOTION_MAP[type]?.label || type,
        color: util.EMOTION_MAP[type]?.color || '#999',
        count,
        percent: Math.round(count / maxCount * 100)
      }))

      let totalLessons = 0
      ;['presence', 'surrender', 'openness'].forEach(p => {
        totalLessons += wx.getStorageSync(`progress_${p}`) || 0
      })

      this.setData({
        totalSessions,
        avgRecovery,
        totalLessons,
        awakeningCoins: wx.getStorageSync('awakeningCoins') || 0,
        emotionDistribution,
        insight: report.generateInsight(entries),
        streakDays: wx.getStorageSync('streakDays') || 0
      })
    }).catch(() => {
      this.setData({ insight: '暂时无法获取报告，请检查网络连接。' })
    })
  }
})
