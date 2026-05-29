Page({
  data: {
    steps: [],
    currentIndex: 0,
    currentStep: '',
    totalSteps: 0,
    isComplete: false,
    path: '',
    lessonId: ''
  },

  onLoad(options) {
    const path = options.path || ''
    const lessonId = options.lessonId || ''
    const practiceText = wx.getStorageSync('practiceText') || ''
    wx.removeStorageSync('practiceText')

    if (!practiceText) {
      wx.showToast({ title: '练习数据加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    // 按双换行拆分练习步骤
    const steps = practiceText.split('\n\n').filter(s => s.trim().length > 0)

    this.setData({
      steps,
      path,
      lessonId,
      totalSteps: steps.length,
      currentStep: steps[0] || ''
    })
  },

  onNext() {
    const { currentIndex, steps } = this.data
    if (currentIndex < steps.length - 1) {
      this.setData({
        currentIndex: currentIndex + 1,
        currentStep: steps[currentIndex + 1]
      })
    } else {
      // 最后一步，显示完成
      this.setData({ isComplete: true })
    }
  },

  onComplete() {
    // 标记课程完成 + 奖励
    const { path, lessonId } = this.data
    const key = `lesson_${path}_${lessonId}`
    if (!wx.getStorageSync(key)) {
      wx.setStorageSync(key, true)

      // 更新进度
      const courses = require('../../data/courses')
      const course = courses[path]
      if (course) {
        let completed = 0
        course.lessons.forEach(l => {
          if (wx.getStorageSync(`lesson_${path}_${l.id}`)) completed++
        })
        wx.setStorageSync(`progress_${path}`, completed)
      }

      // 奖励觉醒币
      const coins = wx.getStorageSync('awakeningCoins') || 0
      wx.setStorageSync('awakeningCoins', coins + 2)
    }

    wx.showToast({ title: '+2 觉醒币 ✓', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1200)
  }
})
