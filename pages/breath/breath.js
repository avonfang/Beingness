const PATTERNS = {
  '478': { name: '4-7-8 放松', phases: [{ label: '吸气', sec: 4 }, { label: '屏息', sec: 7 }, { label: '呼气', sec: 8 }], icon: '🌙', desc: '经典的深度放松节奏', premium: false },
  '444': { name: '4-4-4 平衡', phases: [{ label: '吸气', sec: 4 }, { label: '屏息', sec: 4 }, { label: '呼气', sec: 4 }], icon: '⚖️', desc: '均衡的呼吸节奏', premium: false },
  'box': { name: '箱式呼吸', phases: [{ label: '吸气', sec: 4 }, { label: '屏息', sec: 4 }, { label: '呼气', sec: 4 }, { label: '屏息', sec: 4 }], icon: '🧊', desc: '方形的稳定节奏', premium: false },
  'coherent': { name: '谐振呼吸', phases: [{ label: '吸气', sec: 5 }, { label: '呼气', sec: 5 }], icon: '🌊', desc: '让心率和呼吸同步', premium: true },
  'fire': { name: '火呼吸', phases: [{ label: '吸气', sec: 2 }, { label: '屏息', sec: 1 }, { label: '呼气', sec: 4 }, { label: '屏息', sec: 1 }], icon: '🔥', desc: '激活能量的节奏', premium: true }
}

Page({
  data: {
    selectedPattern: '478',
    patternList: Object.entries(PATTERNS).map(([key, v]) => ({ key, ...v })),
    currentPattern: PATTERNS['478'],
    phase: 'ready',
    phaseLabel: '',
    countdown: 0,
    timerProgress: 0,
    currentRound: 1,
    targetRounds: 6,
    phaseIcon: '🌙',
    isPremium: false,
    themeClass: 'theme-default'
  },

  onLoad() {
    this.refreshState()
  },

  onShow() {
    this.refreshState()
  },

  refreshState() {
    const isPremium = wx.getStorageSync('isPremium') || false
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ isPremium, themeClass: 'theme-' + theme })
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer)
  },

  selectPattern(e) {
    if (this.data.phase !== 'ready') return
    const key = e.currentTarget.dataset.key
    const pattern = PATTERNS[key]
    if (!pattern) return

    if (pattern.premium && !this.data.isPremium) {
      wx.showModal({
        title: '高级呼吸模式',
        content: '「' + pattern.name + '」仅限无限版订阅用户使用。',
        confirmText: '查看升级',
        cancelText: '稍后',
        success: (res) => {
          if (res.confirm) wx.navigateTo({ url: '/pages/profile/profile' })
        }
      })
      return
    }

    wx.vibrateShort({ type: 'light' }).catch(() => {})
    this.setData({
      selectedPattern: key,
      currentPattern: pattern,
      phaseIcon: pattern.icon
    })
  },

  setTarget(e) {
    const n = parseInt(e.currentTarget.dataset.n)
    wx.vibrateShort({ type: 'light' }).catch(() => {})
    this.setData({ targetRounds: n })
  },

  start() {
    wx.vibrateShort({ type: 'medium' }).catch(() => {})
    const pattern = PATTERNS[this.data.selectedPattern]
    const firstPhase = pattern.phases[0]
    this.setData({
      phase: 'running',
      currentRound: 1,
      countdown: firstPhase.sec,
      timerProgress: 100,
      phaseLabel: firstPhase.label,
      currentPhaseIndex: 0
    })
    this.runTimer()
  },

  runTimer() {
    const pattern = this.data.currentPattern
    const idx = this.data.currentPhaseIndex
    const phase = pattern.phases[idx]
    const totalSec = phase.sec
    const startedAt = Date.now()

    // Haptic feedback
    const label = phase.label
    if (label === '吸气') wx.vibrateShort({ type: 'medium' }).catch(() => {})
    else if (label === '屏息') wx.vibrateShort({ type: 'light' }).catch(() => {})
    else if (label === '呼气') wx.vibrateShort({ type: 'heavy' }).catch(() => {})

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

      const drift = (Date.now() - startedAt) - (elapsed * 1000)
      this._timer = setTimeout(tick, Math.max(50, 1000 - drift))
    }

    this._timer = setTimeout(tick, 1000)
  },

  nextPhase() {
    const pattern = this.data.currentPattern
    let nextIdx = this.data.currentPhaseIndex + 1

    if (nextIdx >= pattern.phases.length) {
      const round = this.data.currentRound + 1
      if (round > this.data.targetRounds) {
        this.setData({ phase: 'done', currentRound: this.data.currentRound })
        this.giveReward()
        return
      }
      this.setData({
        currentRound: round,
        currentPhaseIndex: 0,
        countdown: pattern.phases[0].sec,
        timerProgress: 100,
        phaseLabel: pattern.phases[0].label
      })
    } else {
      const nextPhase = pattern.phases[nextIdx]
      this.setData({
        currentPhaseIndex: nextIdx,
        countdown: nextPhase.sec,
        timerProgress: 100,
        phaseLabel: nextPhase.label
      })
    }

    this.runTimer()
  },

  giveReward() {
    const { addCoins } = require('../../utils/coins')
    addCoins(1, '呼吸练习')
  },

  finish() {
    if (this._timer) clearTimeout(this._timer)
    wx.navigateBack()
  },

  restart() {
    this.setData({
      phase: 'ready',
      countdown: 0,
      timerProgress: 0,
      currentRound: 1,
      phaseLabel: ''
    })
  },

  onShareAppMessage() {
    const { addCoins } = require('../../utils/coins')
    addCoins(1, '分享呼吸')
    return { title: '刚做完一组呼吸，心很静 🧘', path: '/pages/breath/breath' }
  }
})
