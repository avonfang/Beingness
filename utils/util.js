function formatDate(date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTime(date) {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const EMOTION_MAP = {
  anxiety: { label: '焦虑', icon: '😰', color: '#D4A5A5' },
  anger: { label: '愤怒', icon: '😤', color: '#D4786A' },
  low: { label: '低落', icon: '😔', color: '#8B9DC3' },
  tangled: { label: '纠结', icon: '😵‍💫', color: '#B8A5C4' }
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

module.exports = { formatDate, formatTime, EMOTION_MAP, pickRandom }
