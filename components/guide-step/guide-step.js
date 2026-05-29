Component({
  properties: {
    text: { type: String, value: '' },
    options: { type: Array, value: [] },
    showNext: { type: Boolean, value: false },
    stepIndex: { type: Number, value: 0 },
    totalSteps: { type: Number, value: 0 }
  },
  methods: {
    onSelect(e) {
      this.triggerEvent('select', { value: e.currentTarget.dataset.value })
    },
    onNext() {
      this.triggerEvent('next')
    }
  }
})
