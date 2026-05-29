const util = require('./util')

const ACHIEVEMENTS = [
  { id: 'first_aid', label: '初次急救', desc: '完成第一次情绪急救', icon: '🌿', check: e => e >= 1 },
  { id: 'five_aid', label: '急救老手', desc: '完成 5 次情绪急救', icon: '🌿', check: e => e >= 5 },
  { id: 'ten_aid', label: '急救达人', desc: '完成 10 次情绪急救', icon: '🌿', check: e => e >= 10 },
  { id: 'first_lesson', label: '初学乍练', desc: '完成第一节课', icon: '📖', check: (e, l) => l >= 1 },
  { id: 'five_lesson', label: '勤学不辍', desc: '完成 5 节课', icon: '📖', check: (e, l) => l >= 5 },
  { id: 'all_presence', label: '临在行者', desc: '完成临在之路全部课程', icon: '🌿', check: (e, l, p) => p.presence === 6 },
  { id: 'all_surrender', label: '臣服者', desc: '完成臣服之路全部课程', icon: '🍂', check: (e, l, p) => p.surrender === 6 },
  { id: 'all_openness', label: '开放者', desc: '完成开放之路全部课程', icon: '💫', check: (e, l, p) => p.openness === 6 },
  { id: 'streak3', label: '坚持 3 天', desc: '连续练习 3 天', icon: '✨', check: (e, l, p, s) => s >= 3 },
  { id: 'streak7', label: '坚持 7 天', desc: '连续练习 7 天', icon: '🌟', check: (e, l, p, s) => s >= 7 },
  { id: 'streak30', label: '坚持 30 天', desc: '连续练习 30 天', icon: '👑', check: (e, l, p, s) => s >= 30 },
  { id: 'first_dialogue', label: '第一封信', desc: '给此刻写第一封信', icon: '💌', check: (e, l, p, s, d) => d >= 1 },
  { id: 'rich_emotions', label: '情绪光谱', desc: '体验过所有 4 种情绪急救', icon: '🌈', check: (e, l, p, s, d, types) => Object.keys(types).length >= 4 },
]

function generateInsight(entries, streakDays, totalLessons, totalDialogues) {
  if (entries.length === 0 && streakDays === 0) {
    return '欢迎。每一次记录，都是看清自己的开始。'
  }

  const parts = []

  // Streak insight
  if (streakDays > 0) {
    if (streakDays >= 30) parts.push(`你已经连续练习 ${streakDays} 天——这是非凡的坚持。你正在把觉知变成一种生活方式。`)
    else if (streakDays >= 7) parts.push(`连续 ${streakDays} 天的练习说明你已经开始形成习惯。继续走下去。`)
    else if (streakDays >= 3) parts.push(`连续 ${streakDays} 天的练习——好的开始。前三天是最难的。`)
    else parts.push(`你已经开始了第 ${streakDays} 天的练习。每天多一点点觉察。`)
  }

  // Emotion insight
  if (entries.length > 0) {
    const types = {}
    entries.forEach(e => { types[e.emotionType] = (types[e.emotionType] || 0) + 1 })
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]
    const topLabel = util.EMOTION_MAP[topType[0]]?.label || topType[0]

    parts.push(`最近你最常出现的是「${topLabel}」。`)
    parts.push(`你的情绪急救完成了 ${entries.length} 次。`)

    // Recovery trend
    const recent = entries.slice(-5)
    const old = entries.slice(0, 5)
    if (recent.length >= 3 && old.length >= 3) {
      const recentAvg = recent.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / recent.length
      const oldAvg = old.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / old.length
      if (recentAvg < oldAvg * 0.8) {
        parts.push('🔔 你的恢复速度在提升——说明你的觉察力越来越强了。')
      }
    }

    const avgRecovery = entries.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / entries.length
    if (avgRecovery < 10) parts.push('你恢复得非常快——你已经掌握了快速回到当下的能力。')
    else if (avgRecovery < 20) parts.push('平均恢复时间在健康范围内。继续练习会更快。')
    else if (avgRecovery >= 30) parts.push('恢复时间还有缩短空间——试试在情绪刚冒头时就做急救。')
  }

  // Course insight
  if (totalLessons > 0) {
    parts.push(`已完成了 ${totalLessons} 节课程。每一课都在重塑你的内在模式。`)
    if (totalLessons >= 6) parts.push('你已经完成了至少一整条路径的学习——这是了不起的进展。')
  }

  // Dialogue insight
  if (totalDialogues > 0) {
    parts.push(`写了 ${totalDialogues} 封信。通过表达，你看见了更多。`)
  }

  return parts.join('\n')
}

function getAchievements(entries, streaks) {
  // Compute stats
  const sessionCount = entries.length

  const progress = {}
  ;['presence', 'surrender', 'openness'].forEach(p => {
    progress[p] = wx.getStorageSync(`progress_${p}`) || 0
  })
  const totalLessons = Object.values(progress).reduce((s, v) => s + v, 0)

  const streakDays = streaks || wx.getStorageSync('streakDays') || 0
  const dialogues = wx.getStorageSync('dialogueHistory') || []

  const types = {}
  entries.forEach(e => { types[e.emotionType] = (types[e.emotionType] || 0) + 1 })

  const achieved = []
  ACHIEVEMENTS.forEach(a => {
    const unlocked = a.check(sessionCount, totalLessons, progress, streakDays, dialogues.length, types)
    if (unlocked) {
      achieved.push({
        id: a.id,
        label: a.label,
        desc: a.desc,
        icon: a.icon
      })
    }
  })
  return achieved
}

function getWeekReport(entries) {
  if (entries.length === 0) return null

  const now = Date.now()
  const dayMs = 86400000
  const weekMs = 7 * dayMs

  const thisWeek = entries.filter(e => {
    const t = e.timestamp || e.createTime || (e.createdAt ? new Date(e.createdAt).getTime() : 0)
    return t > now - weekMs
  })

  const lastWeek = entries.filter(e => {
    const t = e.timestamp || e.createTime || (e.createdAt ? new Date(e.createdAt).getTime() : 0)
    return t > now - 2 * weekMs && t <= now - weekMs
  })

  const thisCounts = {}
  thisWeek.forEach(e => { thisCounts[e.emotionType] = (thisCounts[e.emotionType] || 0) + 1 })
  const lastCounts = {}
  lastWeek.forEach(e => { lastCounts[e.emotionType] = (lastCounts[e.emotionType] || 0) + 1 })

  const thisTotal = thisWeek.length
  const lastTotal = lastWeek.length

  // Find top emotion this week
  let topEmotion = null, topCount = 0
  for (const [type, count] of Object.entries(thisCounts)) {
    if (count > topCount) { topCount = count; topEmotion = type }
  }

  return {
    thisTotal,
    lastTotal,
    change: thisTotal - lastTotal,
    trend: thisTotal > lastTotal ? 'up' : thisTotal < lastTotal ? 'down' : 'same',
    topEmotion: topEmotion ? (util.EMOTION_MAP[topEmotion]?.label || topEmotion) : null,
    topEmotionIcon: topEmotion ? (util.EMOTION_MAP[topEmotion]?.icon || '') : '',
    thisCounts: Object.entries(thisCounts).map(([type, count]) => ({
      type,
      label: util.EMOTION_MAP[type]?.label || type,
      icon: util.EMOTION_MAP[type]?.icon || '',
      count
    }))
  }
}

module.exports = { generateInsight, getAchievements, getWeekReport }
