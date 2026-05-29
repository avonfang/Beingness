// Emotion-aware dialogue response engine
const EMOTION_KEYWORDS = {
  anxiety: ['焦虑', '紧张', '担心', '害怕', '恐惧', '不安', '慌', '睡不着', '压力', '喘不过气'],
  anger: ['愤怒', '生气', '烦躁', '烦', '恼火', '气', '不爽', '忍不了', '火大'],
  low: ['低落', '难过', '伤心', '哭', '抑郁', '没意思', '累', '疲惫', '无力', '空虚', '孤独'],
  tangled: ['纠结', '犹豫', '选', '决定', '不知道', '迷茫', '困惑', '怎么办', '想不通', '矛盾'],
  grateful: ['感恩', '谢谢', '平静', '开心', '好', '幸福', '温暖', '感动', '舒服']
}

const RESPONSES = {
  greeting: [
    '你好。我在这里——不是给你答案，而是陪你一起看清。',
    '欢迎。无论你在经历什么，这一刻你选择了面对它——这已经很有力量。',
    '你来了。很好。说说看，现在什么在困扰你？',
  ],
  anxiety: [
    '我感觉到你有些焦虑。先做一个练习：慢慢地吸一口气，数到四——然后更慢地呼出去，数到六。重复三次。\n\n焦虑往往来自对未来的担忧。但未来不存在于此刻——此刻只有呼吸。',
    '焦虑的能量在身体里是什么感觉？胸口？喉咙？还是胃？\n\n不评判它，只是像观察一朵云一样观察它。',
    '头脑在给你讲一个关于未来的故事。你能不能退一步，看到那个在讲故事的头脑？那个看到头脑在讲故事的「你」——它是不焦虑的。',
    '你不需要解决所有问题。这一刻，你只需要呼吸。接下来的五分钟，你唯一需要做的事就是——呼吸。',
    '把你的注意力从「可能会发生什么」转移到「此刻正在发生什么」。你看到了什么？听到了什么？感受到了什么？',
    '焦虑不是你的敌人——它是你的一部分在试图保护你。对它说「谢谢你，我知道了」，然后回到呼吸。',
  ],
  anger: [
    '愤怒是一团火。在你被它烧到之前——先停三秒。感受那个能量在你身体里，不急着做什么。',
    '愤怒常常是更柔软的东西的盔甲。在愤怒下面，常常是受伤、是害怕。你能感受到愤怒下面有什么吗？',
    '把手放在胸口或者腹部——感受那里的温度。不需要改变什么。只是感受它。愤怒想要被看到。',
    '愤怒来了又会走。它不是你——你是那个看到愤怒在升起的人。从这个位置看，愤怒只是一个能量经过。',
    '那个让你愤怒的事情也许是真的——但你的反应是属于你的。把反应拿回来，你就重新拥有了力量。',
  ],
  low: [
    '我在这里陪你。不需要你现在好起来。不需要你做什么。你在这里，活着，呼吸——这就够了。',
    '低落的时候，整个世界都好像蒙了一层灰色的滤镜。你能看到这个滤镜吗？它不是一个事实——它是一个暂时的感受。',
    '如果你最好的朋友正经历你此刻的感受——你会对ta说什么？现在，把同样的话说给自己听。',
    '你不需要把所有事都想明白。此刻你只需要做一件事——呼吸。只是呼吸。',
    '把注意力放在脚底。感受地面。你在这里。你很安全。这个感受会过去的——所有的浪都会退去。',
    '你已经走了这么远。你比自己以为的更有力量。',
  ],
  tangled: [
    '纠结是因为头脑想要一个「正确」的答案。但如果两个选项都是对的呢？如果无论怎么选，你都会好好的呢？',
    '你看看这两个选项——它们真的有你想象的那么大的差距吗？还是头脑把它们放大了？',
    '有时候不是不知道选什么，而是害怕选错带来的后果。但那个害怕选错的「你」——它本身就是安全的。不管选什么，你都在。',
    '暂时放下选择。去喝杯水。走一走。答案常常在你不找的时候自己出现。',
    '如果没有任何人会评价你——你会怎么选？那个答案可能就是你内心真正的方向。',
  ],
  general: [
    '你能退一步，看看那个在思考的「你」吗？那个注意到自己有这个想法的是谁？',
    '把注意力放在呼吸上。吸气——你知道你在吸气。呼气——你知道你在呼气。只有这个。',
    '念头来了又走了。像云一样。你不是云——你是看云的人。',
    '感受此刻——不是想象中的此刻，而是真实的、正在发生的此刻。你的身体是什么感觉？',
    '如果你能听到你脑子里那个声音，那说明你不是那个声音。你是听到声音的人。',
    '在这个安静的观察者位置，万事万物都顺其自然。',
    '不急着到达什么地方。你已经在这里了。',
  ],
  deep: [
    '你说的是很深的感受。谢谢你信任我。\n\n你能不能在这个感受旁边再待一会儿？不分析它，只是和它一起呼吸？',
    '有些感受不需要「解决」。它们只需要被见证。我在这里见证你。',
    '你可以和这个感受待在一起——也可以随时选择出来。你来决定。这个控制权在你手里。',
    '这个感受不是你。它只是你正在经历的一种能量状态。能量会变化的——就像天气。',
    '你知道吗？你刚才说的那句话，本身就说明了你已经比自己以为的走得更远了。看见，就是疗愈的开始。',
  ]
}

function detectEmotion(text) {
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return emotion
    }
  }
  return null
}

function getResponse(replyCategory, messageIndex) {
  const replies = RESPONSES[replyCategory] || RESPONSES.general
  return replies[messageIndex % replies.length]
}

function generateReply(conversation) {
  const lastMsg = conversation[conversation.length - 1]?.content || ''
  const allUserMsgs = conversation.filter(m => m.role === 'user')
  const turnCount = allUserMsgs.length

  // Short/empty messages
  if (lastMsg.length < 4) {
    const shortReplies = [
      '不用着急。慢慢来，我在这里。',
      '好的。你想多说说吗？不想说也没关系，我们就一起安静地待一会儿。',
      '嗯。不一定要说什么。有时候安静本身也是一种交流。',
    ]
    return shortReplies[turnCount % shortReplies.length]
  }

  // Detect primary emotion
  const emotion = detectEmotion(lastMsg)

  // After multiple turns, go deeper
  if (turnCount >= 4) {
    return getResponse('deep', turnCount)
  }

  if (emotion) {
    return getResponse(emotion, turnCount)
  }

  // Long messages get deeper responses
  if (lastMsg.length > 30) {
    return getResponse('deep', turnCount)
  }

  return getResponse('general', turnCount)
}

module.exports = { generateReply, detectEmotion }
