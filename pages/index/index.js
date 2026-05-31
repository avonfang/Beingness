Page({
  data: {
    selectedEmotion: ''
  },

  onLoad() {
    // 页面加载逻辑
  },

  onShow() {
    // 每次显示刷新
  },

  // 情绪点击
  onEmotionTap(e) {
    const emotion = e.currentTarget.dataset.emotion
    wx.vibrateShort({ type: 'light' }).catch(() => {})

    // 取消选中 或 选中新的
    const newSelected = this.data.selectedEmotion === emotion ? '' : emotion
    this.setData({ selectedEmotion: newSelected })
    if (!newSelected) return

    // 弹出操作面板
    wx.showActionSheet({
      itemList: ['🧘 做一次情绪急救', '💌 写一封信给自己', '🌬️ 做一组呼吸'],
      success(res) {
        if (res.tapIndex === 0) {
          wx.navigateTo({ url: `/pages/emergency/emergency?emotion=${emotion}` })
        } else if (res.tapIndex === 1) {
          wx.navigateTo({ url: '/pages/dialogue/dialogue' })
        } else {
          wx.navigateTo({ url: '/pages/breath/breath' })
        }
      }
    })
  },

  // 开始练习
  goEmergency() {
    wx.navigateTo({ url: '/pages/emergency/emergency' })
  },

  goBreath() {
    wx.navigateTo({ url: '/pages/breath/breath' })
  },

  goDialogue() {
    wx.navigateTo({ url: '/pages/dialogue/dialogue' })
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  onRecommendTap(e) {
    const path = e.currentTarget.dataset.path
    const index = e.currentTarget.dataset.index
    // 推荐对应的课程
    const map = [
      { path: 'presence', lessonIndex: 0 },
      { path: 'openness', lessonIndex: 2 }
    ]
    const rec = map[index] || map[0]
    wx.navigateTo({
      url: `/pages/learning/lesson/lesson?path=${rec.path}&lessonIndex=${rec.lessonIndex}`
    })
  },

  onShareAppMessage() {
    return { title: '此刻 · Being — 回到当下的正念练习', path: '/pages/index/index' }
  }
})
