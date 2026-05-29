const courses = require('../../../data/courses')

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

  onShow() {
    // 从练习页返回后刷新完成状态
    const { path, lesson } = this.data
    if (lesson && lesson.id) {
      const completed = wx.getStorageSync(`lesson_${path}_${lesson.id}`) || false
      if (completed !== this.data.isCompleted) {
        this.setData({ isCompleted: completed })
      }
    }
  },

  loadLesson(path, lessonIndex) {
    const course = courses[path]
    if (!course) return
    const lesson = course.lessons[lessonIndex]
    this.setData({
      path,
      lessonIndex,
      lesson,
      total: course.lessons.length,
      hasNext: lessonIndex < course.lessons.length - 1,
      isCompleted: wx.getStorageSync(`lesson_${path}_${lesson.id}`) || false
    })
    wx.setNavigationBarTitle({ title: course.title })
  },

  startPractice() {
    const { path, lesson } = this.data
    // 把练习文本传给练习页面
    wx.setStorageSync('practiceText', lesson.practice)
    wx.navigateTo({
      url: `/pages/practice/practice?path=${path}&lessonId=${lesson.id}`
    })
  },

  markComplete() {
    const { path, lesson } = this.data
    const key = `lesson_${path}_${lesson.id}`
    if (wx.getStorageSync(key)) return

    wx.setStorageSync(key, true)
    this.setData({ isCompleted: true })

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
