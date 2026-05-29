const PATTERNS = {
  '478': { name: '4-7-8 放松', phases: [{ label: '吸气', sec: 4 }, { label: '屏息', sec: 7 }, { label: '呼气', sec: 8 }], icon: '🌙' },
  '444': { name: '4-4-4 平衡', phases: [{ label: '吸气', sec: 4 }, { label: '屏息', sec: 4 }, { label: '呼气', sec: 4 }], icon: '⚖️' },
  'box': { name: '箱式呼吸', phases: [{ label: '吸气', sec: 4 }, { label: '屏息', sec: 4 }, { label: '呼气', sec: 4 }, { label: '屏息', sec: 4 }], icon: '🧊' }
}

Page({
  data: {
    patterns: PATTERNS,
    selectedPattern: '478',
    phase: 'ready',
    currentPhaseIndex: 0,
    countdown: 0,
    totalRounds: 0,
    currentRound: 1,
    targetRounds: 6,
    timerProgress: 0,
    phaseLabel: '',
    phaseIcon: '🌙'
  },

  onLoad() {
    this.resetReady()
  },

  onUnload() {
    if (this._timer) {
      clearInterval(this._timer)
      clearTimeout(this._timeout)
    }
  },

  selectPattern(e) {
    if (this.data.phase === 'running') return
    const key = e.currentTarget.dataset.key
    const pattern = PATTERNS[key]
    this.setData({
      selectedPattern: key,
      phaseIcon: pattern.icon
    })
    this.resetReady()
  },

  setTarget(e) {
    const n = parseInt(e.currentTarget.dataset.n)
    this.setData({ targetRounds: n })
  },

  resetReady() {
    this.setData({
      phase: 'ready',
      currentPhaseIndex: 0,
      countdown: 0,
      currentRound: 1,
      totalRounds: 0,
      timerProgress: 0,
      phaseLabel: ''
    })
  },

  start() {
    wx.vibrateShort({ type: 'medium' }).catch(() => {})
    const pattern = PATTERNS[this.data.selectedPattern]
    this.setData({
      phase: 'inhale',
      currentPhaseIndex: 0,
      currentRound: 1,
      totalRounds: 0,
      countdown: pattern.phases[0].sec,
      timerProgress: 100,
      phaseLabel: pattern.phases[0].label
    })
    this.runTimer()
  },

  runTimer() {
    const pattern = PATTERNS[this.data.selectedPattern]
    const idx = this.data.currentPhaseIndex
    const phase = pattern.phases[idx]
    let sec = phase.sec

    // Haptic feedback at start of each phase
    if (phase.label === '吸气') wx.vibrateShort({ type: 'medium' }).catch(() => {})
    else if (phase.label === '呼气') wx.vibrateShort({ type: 'heavy' }).catch(() => {})

    this.setData({ countdown: sec, timerProgress: 100 })

    this._timer = setInterval(() => {
      sec--
      const progress = (sec / phase.sec) * 100
      this.setData({ countdown: sec, timerProgress: progress })

      if (sec <= 0) {
        clearInterval(this._timer)
        this.nextPhase()
      }
    }, 1000)
  },

  nextPhase() {
    const pattern = PATTERNS[this.data.selectedPattern]
    let nextIdx = this.data.currentPhaseIndex + 1

    if (nextIdx >= pattern.phases.length) {
      // Round complete
      const round = this.data.currentRound + 1
      if (round > this.data.targetRounds) {
        this.setData({ phase: 'done', currentRound: this.data.currentRound, totalRounds: this.data.currentRound })
        this.giveReward()
        return
      }
      this.setData({ currentRound: round, currentPhaseIndex: 0, totalRounds: this.data.currentRound })
      this.setData({ phaseLabel: pattern.phases[0].label, phase: 'inhale' })
    } else {
      this.setData({ currentPhaseIndex: nextIdx, phaseLabel: pattern.phases[nextIdx].label })
    }

    this.runTimer()
  },

  giveReward() {
    const coins = wx.getStorageSync('awakeningCoins') || 0
    wx.setStorageSync('awakeningCoins', coins + 1)
  },

  finish() {
    wx.navigateBack()
  },

  restart() {
    this.resetReady()
  },

  onShareAppMessage() {
    return { title: '在「此刻」做完了一组呼吸练习，心很静', path: '/pages/breath/breath' }
  }
})
