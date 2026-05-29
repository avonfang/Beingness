const { completeLesson } = require('../../utils/util')

Page({
  data: {
    steps: [],
    currentIndex: 0,
    currentStep: '',
    totalSteps: 0,
    isComplete: false,
    path: '',
    lessonId: '',
    themeClass: 'theme-default'
  },

  onLoad(options) {
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ themeClass: 'theme-' + theme })
    const path = options.path || ''
    const lessonId = options.lessonId || ''
    const practiceText = wx.getStorageSync('practiceText') || ''
    wx.removeStorageSync('practiceText')

    if (!practiceText) {
      wx.showToast({ title: '练习数据加载失败', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

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
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    const { currentIndex, steps } = this.data
    if (currentIndex < steps.length - 1) {
      this.setData({
        currentIndex: currentIndex + 1,
        currentStep: steps[currentIndex + 1]
      })
    } else {
      this.setData({ isComplete: true })
    }
  },

  onComplete() {
    const { path, lessonId } = this.data
    completeLesson(path, lessonId)
    wx.showToast({ title: '+2 ❤️', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 1200)
  }
})
