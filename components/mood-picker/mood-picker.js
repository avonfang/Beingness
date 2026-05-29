Component({
  properties: {
    title: { type: String, value: '现在感觉怎么样？' },
    options: { type: Array, value: [] },
    selected: { type: String, value: '' }
  },
  methods: {
    onSelect(e) {
      this.triggerEvent('select', { value: e.currentTarget.dataset.value })
    }
  }
})
