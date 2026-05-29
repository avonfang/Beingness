const quotes = [
  '你不是你的情绪——你是观察者。',
  '当下是你唯一真正拥有的东西。',
  '痛苦只能存在于当下，但它无法存在于当下——这是个悖论。',
  '你不是那片云，你是看云的人。',
  '当你与思维认同时，你找到了暂时的避难所，却失去了永久的平静。',
  '臣服不是放弃，而是放下对"此刻"的抗拒。',
  '内心的能量如果不被阻塞，它就是生命的喜悦。',
  '问题只存在于时间中。在当下，它不存在。',
  '自由不是控制你的想法，而是不再被它们控制。',
  '在观察者的位置，万事万物都顺其自然。'
]

Page({
  data: { dailyQuote: '' },
  onLoad() {
    const today = new Date().getDate()
    this.setData({ dailyQuote: quotes[today % quotes.length] })
  },
  startEmergency() {
    wx.navigateTo({ url: '/pages/emergency/emergency' })
  }
})
