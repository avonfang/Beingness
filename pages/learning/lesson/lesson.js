const courses = require('../../../data/courses')
const { completeLesson } = require('../../../utils/util')

Page({
  data: {
    path: '',
    lessonIndex: 0,
    lesson: {},
    slides: [],
    currentSlide: 0,
    totalSlides: 0,
    isCompleted: false,
    hasNext: false,
    themeClass: 'theme-default'
  },

  onLoad(options) {
    const theme = wx.getStorageSync('appTheme') || 'default'
    this.setData({ themeClass: 'theme-' + theme })
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

    // Split concept into cards by double newlines
    const conceptCards = lesson.concept.split(/\n\n+/).filter(s => s.trim())
    const slides = conceptCards.map((text, i) => ({
      type: 'concept',
      text: text.trim(),
      icon: i === 0 ? '💡' : i === conceptCards.length - 1 ? '🎯' : '📌'
    }))

    // Practice is the final card
    slides.push({
      type: 'practice',
      text: lesson.practice,
      icon: '🧘'
    })

    this.setData({
      path,
      lessonIndex,
      lesson,
      slides,
      currentSlide: 0,
      totalSlides: slides.length,
      total: course.lessons.length,
      hasNext: lessonIndex < course.lessons.length - 1,
      isCompleted: wx.getStorageSync(`lesson_${path}_${lesson.id}`) || false
    })
    wx.setNavigationBarTitle({ title: course.title })
  },

  nextSlide() {
    if (this.data.currentSlide < this.data.totalSlides - 1) {
      this.setData({ currentSlide: this.data.currentSlide + 1 })
      wx.vibrateShort({ type: 'light' }).catch(() => {})
    }
  },

  prevSlide() {
    if (this.data.currentSlide > 0) {
      this.setData({ currentSlide: this.data.currentSlide - 1 })
      wx.vibrateShort({ type: 'light' }).catch(() => {})
    }
  },

  goSlide(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    if (index !== this.data.currentSlide) {
      this.setData({ currentSlide: index })
    }
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
    wx.showToast({ title: '+2 ❤️', icon: 'success' })
  },

  nextLesson() {
    const { path, lessonIndex } = this.data
    this.loadLesson(path, lessonIndex + 1)
  }
})
