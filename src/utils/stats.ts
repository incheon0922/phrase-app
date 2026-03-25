import type { PracticeRecord, StudyDailyRecord, WrongBookItem } from '../types/study'

function getDateOffset(date: Date, offset: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + offset)
  return next
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function calculateAccuracy(records: PracticeRecord[]) {
  if (records.length === 0) return 0
  const correctCount = records.filter((item) => item.isCorrect).length
  return Math.round((correctCount / records.length) * 100)
}

export function calculateTodayNormalPracticeCount(records: PracticeRecord[], today = new Date()) {
  const todayKey = toDateKey(today)
  return records.filter((item) => item.answeredAt.startsWith(todayKey) && item.source !== 'wrong_book').length
}

export function calculateStudyDays(dailyRecords: StudyDailyRecord[]) {
  return dailyRecords.filter((item) => item.practicedCount > 0).length
}

export function calculateCurrentStreak(dailyRecords: StudyDailyRecord[], today = new Date()) {
  const dateSet = new Set(dailyRecords
    .filter((item) => item.practicedCount > 0)
    .map((item) => item.date))

  let streak = 0
  let cursor = today

  if (!dateSet.has(toDateKey(cursor))) {
    cursor = getDateOffset(cursor, -1)
  }

  while (dateSet.has(toDateKey(cursor))) {
    streak += 1
    cursor = getDateOffset(cursor, -1)
  }

  return streak
}

export function getTodayStudyRecord(dailyRecords: StudyDailyRecord[], today = new Date()) {
  const todayKey = toDateKey(today)
  return dailyRecords.find((item) => item.date === todayKey)
}

export function getActiveWrongBookCount(items: WrongBookItem[]) {
  return items.filter((item) => !item.resolved).length
}
