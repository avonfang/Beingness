const util = require('./util')

function generateInsight(entries) {
  if (entries.length === 0) return '还没有足够的数据生成洞察。开始记录你的情绪吧。'

  const types = {}
  entries.forEach(e => { types[e.emotionType] = (types[e.emotionType] || 0) + 1 })
  const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]
  const topLabel = util.EMOTION_MAP[topType[0]]?.label || topType[0]
  const avgRecovery = entries.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / entries.length

  let insight = `最近你最常出现的情绪是「${topLabel}」。`
  if (avgRecovery < 15) insight += '\n你从情绪中恢复的速度很快，说明觉察力在提升。'
  else if (avgRecovery < 30) insight += '\n平均恢复时间在可接受范围内。'
  else insight += '\n平均恢复时间较长——试试在情绪刚出现时就打开急救模式。'
  return insight
}

module.exports = { generateInsight }
