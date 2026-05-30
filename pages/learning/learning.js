const courses = require('../../data/courses')

Page({
  data: { lessons: [], themeClass: 'theme-default' },

  onShow() {
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ themeClass: 'theme-' + theme })
    this.loadLessons()
  },

  loadLessons() {
    const lessons = []
    const pathKeys = ['presence', 'surrender', 'openness']
    pathKeys.forEach(pathKey => {
      const course = courses[pathKey]
      if (!course) return
      course.lessons.forEach((lesson, idx) => {
        const completed = !!wx.getStorageSync(`lesson_${pathKey}_${lesson.id}`)
        lessons.push({
          key: pathKey,
          lessonIndex: idx,
          id: lesson.id,
          title: lesson.title,
          subtitle: lesson.subtitle,
          icon: course.icon,
          source: course.source,
          completed
        })
      })
    })
    this.setData({ lessons })
  },

  openLesson(e) {
    const { key, lessonindex } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/learning/lesson/lesson?path=${key}&lessonIndex=${lessonindex}` })
  },

  randomLesson() {
    const lessons = this.data.lessons
    const uncompleted = lessons.filter(l => !l.completed)
    const pool = uncompleted.length > 0 ? uncompleted : lessons
    const pick = pool[Math.floor(Math.random() * pool.length)]
    wx.navigateTo({ url: `/pages/learning/lesson/lesson?path=${pick.key}&lessonIndex=${pick.lessonIndex}` })
  }
})
