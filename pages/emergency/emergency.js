const guides = require('../../data/guides')

Page({
  data: {
    phase: 'select',
    emotionOptions: [
      { value: 'anxiety', label: '焦虑/恐惧', icon: '😰' },
      { value: 'anger', label: '愤怒/烦躁', icon: '😤' },
      { value: 'low', label: '无力/低落', icon: '😔' },
      { value: 'tangled', label: '纠结/内耗', icon: '😵‍💫' }
    ],
    selectedEmotion: '',
    stepIndex: 0,
    totalSteps: 0,
    steps: [],
    currentStep: {},
    selectedOptions: {},
    note: '',
    rating: 0,
    startTime: null,
    themeClass: 'theme-default'
  },

  onLoad(options) {
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ themeClass: 'theme-' + theme, startTime: Date.now() })

    // If pre-selected emotion from homepage tags, skip selection
    if (options && options.emotion) {
      this.startWithEmotion(options.emotion)
    }
  },

  startWithEmotion(emotion) {
    const steps = guides[emotion].steps
    const showCrisis = emotion === 'low'
    if (showCrisis) {
      wx.showModal({
        title: '💛 我在这里',
        content: '你选择面对此刻的感受，这已经很有勇气。\n\n如果你感到非常痛苦，请不要一个人承受。可以拨打心理援助热线：\n\n📞 全国心理援助热线：400-161-9995\n📞 北京心理危机研究与干预中心：010-82951332',
        showCancel: false,
        confirmText: '好的，继续'
      })
    }
    this.setData({
      selectedEmotion: emotion,
      phase: 'guide',
      steps: steps,
      totalSteps: steps.length,
      stepIndex: 0,
      currentStep: this.resolveStep(steps[0], null)
    })
  },

  onShow() {
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ themeClass: 'theme-' + theme })
  },

  onEmotionSelect(e) {
    const emotion = e.detail.value
    const steps = guides[emotion].steps
    const showCrisis = emotion === 'low'
    if (showCrisis) {
      wx.showModal({
        title: '💛 我在这里',
        content: '你选择面对此刻的感受，这已经很有勇气。\n\n如果你感到非常痛苦，请不要一个人承受。可以拨打心理援助热线：\n\n📞 全国心理援助热线：400-161-9995\n📞 北京心理危机研究与干预中心：010-82951332',
        showCancel: false,
        confirmText: '好的，继续'
      })
    }
    this.setData({
      selectedEmotion: emotion,
      phase: 'guide',
      steps: steps,
      totalSteps: steps.length,
      stepIndex: 0,
      currentStep: this.resolveStep(steps[0], null),
      showCrisis
    })
  },

  resolveStep(step, previousOption) {
    if (typeof step.text === 'object') {
      const branchText = step.text[previousOption]
      return {
        text: branchText || Object.values(step.text)[0],
        options: step.options || [],
        showNext: !(step.options && step.options.length > 0)
      }
    }
    return {
      text: step.text,
      options: step.options || [],
      showNext: !(step.options && step.options.length > 0)
    }
  },

  onGuideSelect(e) {
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    const value = e.detail.value
    const stepIndex = this.data.stepIndex
    const step = this.data.steps[stepIndex]
    const key = `${stepIndex}`
    const selectedOptions = { ...this.data.selectedOptions, [key]: value }

    if (stepIndex < this.data.steps.length - 1) {
      const nextStep = this.resolveStep(this.data.steps[stepIndex + 1], value)
      this.setData({
        selectedOptions,
        stepIndex: stepIndex + 1,
        currentStep: nextStep
      })
    } else {
      this.setData({ selectedOptions, phase: 'complete' })
    }
  },

  onGuideBack() {
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    const stepIndex = this.data.stepIndex
    if (stepIndex > 0) {
      // Go back to previous step
      const prevStep = this.resolveStep(this.data.steps[stepIndex - 1], null)
      this.setData({ stepIndex: stepIndex - 1, currentStep: prevStep })
    } else {
      // Go back to emotion selection
      this.setData({ phase: 'select', stepIndex: 0, selectedEmotion: '', selectedOptions: {} })
    }
  },

  onGuideNext() {
    const stepIndex = this.data.stepIndex
    if (stepIndex < this.data.steps.length - 1) {
      const nextStep = this.resolveStep(this.data.steps[stepIndex + 1], null)
      this.setData({ stepIndex: stepIndex + 1, currentStep: nextStep })
    } else {
      this.setData({ phase: 'complete' })
    }
  },

  onNoteInput(e) { this.setData({ note: e.detail.value }) },

  setRating(e) { this.setData({ rating: parseInt(e.currentTarget.dataset.idx) + 1 }) },

  addCoin(amount) {
    const coins = wx.getStorageSync('awakeningCoins') || 0
    const newTotal = coins + amount
    wx.setStorageSync('awakeningCoins', newTotal)
    return newTotal
  },

  deepDialogue() {
    wx.navigateTo({ url: '/pages/dialogue/dialogue' })
  },

  saveAndExit() {
    const recoveryMinutes = Math.round((Date.now() - this.data.startTime) / 60000)
    const entry = {
      emotionType: this.data.selectedEmotion,
      trigger: '',
      bodyPart: Object.values(this.data.selectedOptions).join(','),
      completedSteps: true,
      recoveryMinutes: recoveryMinutes,
      note: this.data.note,
      rating: this.data.rating,
      createdAt: new Date().toISOString()
    }
    const local = wx.getStorageSync('pendingEntries') || []
    local.push(entry)
    wx.setStorageSync('pendingEntries', local)
    this.addCoin(1)
    wx.showToast({ title: '+1 ❤️', icon: 'success' })
    this.setData({ phase: 'done' })
  },

  goBack() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  onShareAppMessage() {
    this.addCoin(1)
    return { title: '刚完成了一次情绪急救 🌿 推荐「此刻」给你', path: '/pages/index/index' }
  }
})
