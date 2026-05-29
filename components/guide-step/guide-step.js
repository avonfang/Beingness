Component({
  properties: {
    text: { type: String, value: '' },
    options: { type: Array, value: [] },
    showNext: { type: Boolean, value: false }
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
