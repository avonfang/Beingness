const util = require('../../utils/util')
const report = require('../../utils/report')
const { THEMES } = require('../../data/themes')

const COIN_PACKS = [
  { id: 'small', icon: '🌱', label: '6 枚觉醒币', price: '¥6', bonus: 0 },
  { id: 'medium', icon: '🌿', label: '30 枚觉醒币', price: '¥25', bonus: 6 },
  { id: 'large', icon: '🌳', label: '88 枚觉醒币', price: '¥68', bonus: 22 }
]

Page({
  data: {
    streakDays: 0,
    totalSessions: 0,
    avgRecovery: 0,
    totalLessons: 0,
    totalDialogues: 0,
    awakeningCoins: 0,
    emotionDistribution: [],
    insight: '加载中...',
    milestone: null,
    weekData: { current: 0, previous: 0, trend: 'same' },
    nextMilestone: null,
    achievements: [],
    weekReport: null,
    coinPacks: COIN_PACKS,
    isPremium: false,
    themes: Object.entries(THEMES).map(([id, t]) => ({ id, ...t })),
    currentTheme: 'default'
  },

  onShow() {
    const isPremium = wx.getStorageSync('isPremium') || false
    const currentTheme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ isPremium, currentTheme })
    this.loadReport()
  },

  loadReport() {
    const entries = wx.getStorageSync('pendingEntries') || []
    const dialogues = wx.getStorageSync('dialogueHistory') || []

    const totalSessions = entries.length
    const totalDialogues = dialogues.length
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

    let totalLessons = 0;
    ['presence', 'surrender', 'openness'].forEach(p => {
      totalLessons += wx.getStorageSync(`progress_${p}`) || 0
    })

    const streakDays = wx.getStorageSync('streakDays') || 0
    const milestone = this.getMilestone(streakDays)
    const nextMilestone = this.getNextMilestone(streakDays)
    const weekData = this.getWeekTrend(entries)
    const achievements = report.getAchievements(entries, streakDays)
    const weekReport = report.getWeekReport(entries)

    this.setData({
      totalSessions,
      totalDialogues,
      avgRecovery,
      totalLessons,
      awakeningCoins: wx.getStorageSync('awakeningCoins') || 0,
      emotionDistribution,
      insight: report.generateInsight(entries, streakDays, totalLessons, totalDialogues),
      streakDays,
      milestone,
      nextMilestone,
      weekData,
      achievements,
      weekReport
    })
  },

  getMilestone(days) {
    if (days >= 30) return { emoji: '👑', label: '三十日觉者', desc: '坚持一个月，了不起的旅程' }
    if (days >= 7) return { emoji: '🌟', label: '七日觉醒', desc: '连续七日，觉醒之光' }
    if (days >= 3) return { emoji: '✨', label: '三日初醒', desc: '连续三日，初现觉知' }
    return null
  },

  getNextMilestone(days) {
    if (days < 3) return { days: 3, label: '三日初醒 ✨', remain: 3 - days }
    if (days < 7) return { days: 7, label: '七日觉醒 🌟', remain: 7 - days }
    if (days < 30) return { days: 30, label: '三十日觉者 👑', remain: 30 - days }
    return null
  },

  getWeekTrend(entries) {
    const now = Date.now()
    const weekMs = 7 * 86400000
    let current = 0, previous = 0

    entries.forEach(e => {
      const t = e.timestamp || e.createTime || (e.createdAt ? new Date(e.createdAt).getTime() : 0)
      if (t > now - weekMs) current++
      else if (t > now - 2 * weekMs) previous++
    })

    let trend = 'same'
    if (current > previous) trend = 'up'
    else if (current < previous) trend = 'down'
    return { current, previous, trend }
  },

  buyCoins(e) {
    const packId = e.currentTarget.dataset.id
    const pack = COIN_PACKS.find(p => p.id === packId)
    if (!pack) return

    wx.showModal({
      title: `购买 ${pack.label}`,
      content: `价格：${pack.price}${pack.bonus ? `（赠 ${pack.bonus} 币）` : ''}\n\n微信支付需开通商户号。点击确认模拟购买 +${pack.bonus > 0 ? pack.bonus + 6 : 6} 觉醒币。`,
      success: (res) => {
        if (res.confirm) {
          const coins = wx.getStorageSync('awakeningCoins') || 0
          const earned = pack.id === 'small' ? 6 : pack.id === 'medium' ? 36 : 110
          wx.setStorageSync('awakeningCoins', coins + earned)
          this.setData({ awakeningCoins: wx.getStorageSync('awakeningCoins') })
          wx.showToast({ title: `+${earned} 觉醒币 ✦`, icon: 'success' })
        }
      }
    })
  },

  buyPremium() {
    wx.showModal({
      title: '此刻 · 无限版',
      content: '¥9.9/月 — 无限深度对话 · 高级呼吸模式 · 专属主题\n\n微信支付开通后即可订阅。点击确认模拟激活 30 天。',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('isPremium', true)
          this.setData({ isPremium: true })
          wx.showToast({ title: '无限版已激活 ✓', icon: 'success' })
        }
      }
    })
  },

  selectTheme(e) {
    const themeId = e.currentTarget.dataset.theme
    const theme = THEMES[themeId]
    if (!theme) return

    // Premium gate
    if (theme.premium && !this.data.isPremium) {
      wx.showModal({
        title: '高级主题',
        content: '「' + theme.name + '」主题仅限无限版订阅用户使用。升级后即可更换。',
        confirmText: '查看升级',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) {
            wx.showModal({
              title: '此刻 · 无限版',
              content: '¥9.9/月 — 解锁全部高级主题 · 无限对话 · 高级呼吸模式',
              confirmText: '订阅',
              cancelText: '取消',
              success: (r) => {
                if (r.confirm) {
                  wx.setStorageSync('isPremium', true)
                  this.setData({ isPremium: true })
                  wx.showToast({ title: '无限版已激活 ✓', icon: 'success' })
                }
              }
            })
          }
        }
      })
      return
    }

    wx.setStorageSync('appTheme', themeId)
    this.setData({ currentTheme: themeId })
    wx.showToast({ title: '已切换「' + theme.name + '」主题', icon: 'success' })
  },

  exportData() {
    const entries = wx.getStorageSync('pendingEntries') || []
    const dialogues = wx.getStorageSync('dialogueHistory') || []

    let text = '=== 此刻 · 我的觉醒日志 ===\n'
    text += `导出时间：${new Date().toLocaleString('zh-CN')}\n`
    text += `连续练习：${this.data.streakDays} 天\n`
    text += `急救次数：${entries.length} 次\n`
    text += `对话次数：${dialogues.length} 次\n`
    text += `完成课程：${this.data.totalLessons} 课\n`
    text += `觉醒币：${this.data.awakeningCoins}\n\n`

    if (entries.length > 0) {
      text += '--- 情绪急救记录 ---\n'
      entries.forEach((e, i) => {
        const label = util.EMOTION_MAP[e.emotionType]?.label || e.emotionType
        const date = e.createdAt ? new Date(e.createdAt).toLocaleString('zh-CN') : '未知时间'
        text += `${i + 1}. [${date}] ${label}`
        if (e.recoveryMinutes) text += ` · 恢复 ${e.recoveryMinutes} 分钟`
        if (e.rating) text += ` · ${'★'.repeat(e.rating)}`
        if (e.note) text += `\n   笔记：${e.note}`
        text += '\n'
      })
      text += '\n'
    }

    if (dialogues.length > 0) {
      text += '--- 深度对话记录 ---\n'
      dialogues.forEach((d, i) => {
        const date = d.createdAt ? new Date(d.createdAt).toLocaleString('zh-CN') : '未知时间'
        text += `${i + 1}. [${date}] ${d.messageCount} 条消息`
        if (d.preview) text += ` · 「${d.preview}」`
        text += '\n'
      })
    }

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  }
})
