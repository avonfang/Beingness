const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

  const entries = await db.collection('moodEntries')
    .where({
      _openid: OPENID,
      createdAt: db.command.gte(weekAgo)
    })
    .get()

  return {
    total: entries.data.length,
    avgRecovery: entries.data.length
      ? entries.data.reduce((s, e) => s + (e.recoveryMinutes || 0), 0) / entries.data.length
      : 0
  }
}
