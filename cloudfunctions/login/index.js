const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const users = db.collection('users')
  const existing = await users.where({ _openid: OPENID }).get()

  if (existing.data.length === 0) {
    await users.add({
      data: {
        _openid: OPENID,
        nickname: '觉醒者',
        courseProgress: { presence: 0, surrender: 0, openness: 0 },
        streakDays: 0,
        lastActiveDate: '',
        awakeningCoins: 10,
        settings: { remindTime: '20:00' },
        createdAt: db.serverDate()
      }
    })
    return { openid: OPENID, isNew: true, coins: 10 }
  }

  // 兼容旧数据：没有 awakeningCoins 字段的给默认值
  const user = existing.data[0]
  if (user.awakeningCoins === undefined) {
    await users.doc(user._id).update({
      data: { awakeningCoins: 10 }
    })
  }

  return { openid: OPENID, isNew: false, coins: user.awakeningCoins || 10 }
}
