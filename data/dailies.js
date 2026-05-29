// 每日练习轮换 — 从课程中提取 18 个核心练习
// 按日期轮换，确保每天有新鲜内容
const courses = require('./courses')

function getAllPractices() {
  const practices = []
  for (const [pathKey, course] of Object.entries(courses)) {
    course.lessons.forEach((lesson, idx) => {
      practices.push({
        id: `${pathKey}_${lesson.id}`,
        title: lesson.title,
        subtitle: lesson.subtitle,
        practice: lesson.practice,
        pathLabel: `${course.icon} ${course.title}`,
        pathKey,
        lessonIndex: idx
      })
    })
  }
  return practices
}

const ALL_PRACTICES = getAllPractices() // 18 items

/**
 * 获取今日练习 —— 基于日期轮转
 * 每年 365 天，18 个练习 → 每个练习每 ~20 天重复一次
 */
function getDailyPractice() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const diff = now - startOfYear
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  const idx = dayOfYear % ALL_PRACTICES.length
  return { ...ALL_PRACTICES[idx], dayOfYear, total: ALL_PRACTICES.length }
}

module.exports = { getDailyPractice, ALL_PRACTICES }
