const guides = require('../../data/guides.json')

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
    startTime: null
  },

  onLoad() {
    this.setData({ startTime: Date.now() })
  },

  onEmotionSelect(e) {
    const emotion = e.detail.value
    const steps = guides[emotion].steps
    this.setData({
      selectedEmotion: emotion,
      phase: 'guide',
      steps: steps,
      totalSteps: steps.length,
      stepIndex: 0,
      currentStep: this.resolveStep(steps[0], null)
    })
  },

  resolveStep(step, previousOption) {
    if (typeof step.text === 'object') {
      const branchText = step.text[previousOption]
      return { text: branchText || Object.values(step.text)[0], options: step.options || [] }
    }
    return { text: step.text, options: step.options || [] }
  },

  onGuideSelect(e) {
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

  setRating(e) { this.setData({ rating: e.currentTarget.dataset.value }) },

  saveAndExit() {
    const db = wx.cloud.database()
    const recoveryMinutes = Math.round((Date.now() - this.data.startTime) / 60000)
    db.collection('moodEntries').add({
      data: {
        emotionType: this.data.selectedEmotion,
        trigger: '',
        bodyPart: Object.values(this.data.selectedOptions).join(','),
        completedSteps: true,
        recoveryMinutes: recoveryMinutes,
        note: this.data.note,
        rating: this.data.rating,
        createdAt: db.serverDate()
      }
    }).then(() => {
      wx.showToast({ title: '已记录', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    }).catch(() => {
      // 离线模式：存本地缓存
      const local = wx.getStorageSync('pendingEntries') || []
      local.push({
        emotionType: this.data.selectedEmotion,
        recoveryMinutes,
        note: this.data.note,
        rating: this.data.rating,
        createdAt: new Date().toISOString()
      })
      wx.setStorageSync('pendingEntries', local)
      wx.showToast({ title: '已记录', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1500)
    })
  }
})
