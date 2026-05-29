const courses = require('../../data/courses')

Page({
  data: { paths: [] },

  onShow() { this.loadProgress() },

  loadProgress() {
    const paths = Object.entries(courses).map(([key, course]) => {
      const cache = wx.getStorageSync(`progress_${key}`) || 0
      return {
        key,
        ...course,
        total: course.lessons.length,
        progress: cache,
        progressPercent: Math.round((cache / course.lessons.length) * 100)
      }
    })
    this.setData({ paths })
  },

  openPath(e) {
    const key = e.currentTarget.dataset.key
    wx.navigateTo({ url: `/pages/learning/lesson/lesson?path=${key}&lessonIndex=0` })
  }
})
