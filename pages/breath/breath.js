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
    phaseDuration: 0,
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
      clearTimeout(this._timer)
    }
  },

  selectPattern(e) {
    if (this.data.phase === 'running') return
    const key = e.currentTarget.dataset.key
    const pattern = PATTERNS[key]
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    this.setData({
      selectedPattern: key,
      phaseIcon: pattern.icon
    })
    this.resetReady()
  },

  setTarget(e) {
    const n = parseInt(e.currentTarget.dataset.n)
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    this.setData({ targetRounds: n })
  },

  resetReady() {
    this.setData({
      phase: 'ready',
      currentPhaseIndex: 0,
      countdown: 0,
      phaseDuration: 0,
      currentRound: 1,
      totalRounds: 0,
      timerProgress: 0,
      phaseLabel: ''
    })
  },

  start() {
    wx.vibrateShort({ type: 'medium' }).catch(() => {})
    const pattern = PATTERNS[this.data.selectedPattern]
    const sec = pattern.phases[0].sec
    this.setData({
      phase: 'inhale',
      currentPhaseIndex: 0,
      currentRound: 1,
      totalRounds: 0,
      countdown: sec,
      phaseDuration: sec,
      timerProgress: 100,
      phaseLabel: pattern.phases[0].label
    })
    this.runTimer()
  },

  runTimer() {
    const pattern = PATTERNS[this.data.selectedPattern]
    const idx = this.data.currentPhaseIndex
    const phase = pattern.phases[idx]
    const totalSec = phase.sec
    const startedAt = Date.now()
    this.setData({ phaseDuration: totalSec })

    // Haptic at phase transitions
    if (phase.label === '吸气') wx.vibrateShort({ type: 'medium' }).catch(() => {})
    else if (phase.label === '屏息') wx.vibrateShort({ type: 'light' }).catch(() => {})
    else if (phase.label === '呼气') wx.vibrateShort({ type: 'heavy' }).catch(() => {})

    const tick = () => {
      const elapsed = Math.round((Date.now() - startedAt) / 1000)
      const remaining = totalSec - elapsed

      if (remaining <= 0) {
        this.setData({ countdown: 0, timerProgress: 0 })
        this.nextPhase()
        return
      }

      this.setData({
        countdown: remaining,
        timerProgress: (remaining / totalSec) * 100
      })

      // Self-correcting: schedule next tick at next second boundary
      const drift = (Date.now() - startedAt) - (elapsed * 1000)
      this._timer = setTimeout(tick, Math.max(50, 1000 - drift))
    }

    this._timer = setTimeout(tick, 1000)
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
