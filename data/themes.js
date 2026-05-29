const THEMES = {
  default: { name: '金色', icon: '✨', desc: '经典金色主题', premium: false },
  ocean: { name: '海洋', icon: '🌊', desc: '静谧蓝色调', premium: true },
  forest: { name: '森林', icon: '🌿', desc: '清新绿色调', premium: true }
}

function getTheme() {
  return wx.getStorageSync('appTheme') || 'default'
}

function getThemeClass() {
  return 'theme-' + getTheme()
}

function applyTheme() {
  const theme = getTheme()
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (page && page.setData) {
    page.setData({ themeClass: 'theme-' + theme })
  }
}

module.exports = { THEMES, getTheme, getThemeClass, applyTheme }
