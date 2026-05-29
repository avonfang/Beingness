const courses = require('../../../data/courses')
const { completeLesson } = require('../../../utils/util')

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
    wx.setStorageSync('practiceText', lesson.practice)
    wx.navigateTo({
      url: `/pages/practice/practice?path=${path}&lessonId=${lesson.id}`
    })
  },

  markComplete() {
    const { path, lesson } = this.data
    const rewarded = completeLesson(path, lesson.id)
    if (!rewarded) return

    this.setData({ isCompleted: true })
    wx.showToast({ title: '+2 觉醒币', icon: 'success' })
  },

  nextLesson() {
    const { path, lessonIndex } = this.data
    this.loadLesson(path, lessonIndex + 1)
  }
})
