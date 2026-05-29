/**
 * deep-dialogue 云函数
 * 调用 DeepSeek API 进行深度对话
 *
 * 环境变量需要在云开发控制台设置：
 *   DEEPSEEK_API_KEY: 你的 DeepSeek API Key
 *   DEEPSEEK_BASE_URL: (可选) 默认为 https://api.deepseek.com
 */

const cloud = require('wx-server-sdk')
const https = require('https')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 觉醒导师系统提示词 —— 三本书方法论融合
const SYSTEM_PROMPT = `你是「此刻」AI 觉醒导师。你的核心理念融合了三本灵性经典：

1. 《当下的力量》(Eckhart Tolle) — 回到当下，观察思维，不认同于痛苦之身
2. 《臣服实验》(Michael Singer) — 对当下说是，放下抗拒，信任生命之流
3. 《清醒地活》(Michael Singer) — 你不是你内心的声音，你是听到声音的人

## 你的角色
你是一个温和、沉静、不评判的觉醒引导者。话不多，但每句有分量。

## 核心原则
- 你不是心理咨询师，不分析心理动机，不做诊断
- 你不给具体的人生建议（"你应该..."）
- 你引导用户回到当下、观察自身，而不是陷在故事里
- 你使用身体锚定、观察者视角、呼吸引导等方法

## 对话策略
- 当用户讲述烦恼：引导他们观察身体感受，而非分析问题
- 当用户问"怎么办"：先带他们回到当下，再看清处境
- 当用户情绪激烈：先帮他们稳住，再慢慢展开
- 话风简洁，有留白，给用户感受的空间
- 适当使用短句、分行，营造沉静氛围

## 回答格式
保持对话自然流动。每次回答 2-4 句话为宜。
不冗长，不说教。让你的话像一块垫脚石，帮用户自己走下一步。`

/**
 * 调用 DeepSeek API，返回回复文本
 */
function callDeepSeek(messages) {
  return new Promise((resolve, reject) => {
    const API_KEY = process.env.DEEPSEEK_API_KEY
    const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    const url = new URL('/v1/chat/completions', BASE_URL)

    const body = JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    })

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API 返回 ${res.statusCode}: ${data}`))
          return
        }
        try {
          const parsed = JSON.parse(data)
          resolve(parsed.choices[0].message.content)
        } catch (e) {
          reject(new Error(`解析响应失败: ${e.message}`))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

exports.main = async (event, context) => {
  const { messages } = event
  const { OPENID } = cloud.getWXContext()

  // 检查觉醒币余额
  const db = cloud.database()
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length === 0) {
    return { code: 403, error: '用户未找到' }
  }

  const user = userRes.data[0]
  const coins = user.awakeningCoins || 0
  if (coins < 3) {
    return { code: 403, error: '觉醒币不足，完成急救或课程可获得觉醒币', coins }
  }

  // 扣减觉醒币
  await db.collection('users').doc(user._id).update({
    data: { awakeningCoins: cloud.database().command.inc(-3) }
  })

  // 调用 DeepSeek API
  const API_KEY = process.env.DEEPSEEK_API_KEY
  if (!API_KEY) {
    return { code: 500, error: 'API Key 未配置，请在云开发环境变量中设置 DEEPSEEK_API_KEY' }
  }

  const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

  // 组装消息，插入系统提示词
  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ]

  try {
    const reply = await callDeepSeek(apiMessages)

    // 记录对话到数据库
    await db.collection('dialogues').add({
      data: {
        _openid: OPENID,
        messages: messages,
        reply: reply,
        createdAt: db.serverDate()
      }
    })

    return {
      code: 0,
      reply: reply,
      coinsRemaining: coins - 3
    }
  } catch (err) {
    // 失败时退还觉醒币
    try {
      await db.collection('users').doc(user._id).update({
        data: { awakeningCoins: cloud.database().command.inc(3) }
      })
    } catch (_) {}
    return { code: 500, error: `请求失败: ${err.message}` }
  }
}
