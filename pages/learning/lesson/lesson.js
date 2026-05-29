const courses = require('../../../data/courses.json')

Page({
  data: {
    path: '',
    lessonIndex: 0,
    lesson: {},
    isCompleted: false,
    hasNext: false
  },

  onLoad(options) {
    const path = options.path || 'presence'
    const lessonIndex = parseInt(options.lessonIndex) || 0
    this.loadLesson(path, lessonIndex)
  },

  loadLesson(path, lessonIndex) {
    const course = courses[path]
    if (!course) return
    const lesson = course.lessons[lessonIndex]
    this.setData({
      path,
      lessonIndex,
      lesson,
      hasNext: lessonIndex < course.lessons.length - 1,
      isCompleted: wx.getStorageSync(`lesson_${path}_${lesson.id}`) || false
    })
    wx.setNavigationBarTitle({ title: course.title })
  },

  markComplete() {
    const { path, lesson } = this.data
    const key = `lesson_${path}_${lesson.id}`
    if (wx.getStorageSync(key)) return // 已经完成过了，不再奖励

    wx.setStorageSync(key, true)
    this.setData({ isCompleted: true })

    // 奖励觉醒币
    const coins = wx.getStorageSync('awakeningCoins') || 0
    wx.setStorageSync('awakeningCoins', coins + 2)
    wx.showToast({ title: '+2 觉醒币', icon: 'success' })

    const course = courses[path]
    let completed = 0
    course.lessons.forEach(l => {
      if (wx.getStorageSync(`lesson_${path}_${l.id}`)) completed++
    })
    wx.setStorageSync(`progress_${path}`, completed)
  },

  nextLesson() {
    const { path, lessonIndex } = this.data
    this.loadLesson(path, lessonIndex + 1)
  }
})
