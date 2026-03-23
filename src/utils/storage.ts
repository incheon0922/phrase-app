import Taro from '@tarojs/taro'
import type {
  PracticeRecord,
  StudyDailyRecord,
  StudyStatsState,
  WrongBookItem
} from '../types/study'
import type { VocabularyItem } from '../types/vocabulary'

const VOCABULARY_STORAGE_KEY = 'phrase-app:vocabulary-items'
const PRACTICE_RECORD_STORAGE_KEY = 'phrase-app:practice-records'
const STUDY_STATS_STORAGE_KEY = 'phrase-app:study-stats'
const WRONG_BOOK_STORAGE_KEY = 'phrase-app:wrong-book'
const DEFAULT_PRACTICE_COUNT_STORAGE_KEY = 'phrase-app:default-practice-count'

export function getVocabularyItems(): VocabularyItem[] {
  try {
    return Taro.getStorageSync(VOCABULARY_STORAGE_KEY) || []
  } catch (error) {
    return []
  }
}

export function setVocabularyItems(items: VocabularyItem[]) {
  Taro.setStorageSync(VOCABULARY_STORAGE_KEY, items)
}

export function appendVocabularyItems(items: VocabularyItem[]) {
  const existingItems = getVocabularyItems()
  const existingWords = new Set(existingItems.map((item) => item.word))
  const nextItems = [...existingItems]

  let addedCount = 0
  let duplicatedCount = 0

  items.forEach((item) => {
    if (existingWords.has(item.word)) {
      duplicatedCount += 1
      return
    }

    existingWords.add(item.word)
    nextItems.push(item)
    addedCount += 1
  })

  setVocabularyItems(nextItems)

  return {
    addedCount,
    duplicatedCount,
    totalCount: nextItems.length
  }
}

export function clearVocabularyItems() {
  Taro.removeStorageSync(VOCABULARY_STORAGE_KEY)
}

export function updateVocabularyPracticeResult(vocabularyId: string, isCorrect: boolean) {
  const items = getVocabularyItems()
  const nextItems = items.map((item) => {
    if (item.id !== vocabularyId) {
      return item
    }

    return {
      ...item,
      wrongCount: isCorrect ? item.wrongCount : item.wrongCount + 1,
      masteryLevel: isCorrect
        ? Math.min(item.masteryLevel + 1, 5)
        : Math.max(item.masteryLevel - 1, 0),
      updatedAt: new Date().toISOString()
    }
  })

  setVocabularyItems(nextItems)
  return nextItems
}

export function getPracticeRecords(): PracticeRecord[] {
  try {
    return Taro.getStorageSync(PRACTICE_RECORD_STORAGE_KEY) || []
  } catch (error) {
    return []
  }
}

export function setPracticeRecords(records: PracticeRecord[]) {
  Taro.setStorageSync(PRACTICE_RECORD_STORAGE_KEY, records)
}

export function appendPracticeRecord(record: PracticeRecord) {
  const records = getPracticeRecords()
  const nextRecords = [...records, record]
  setPracticeRecords(nextRecords)
  return nextRecords
}

export function clearPracticeRecords() {
  Taro.removeStorageSync(PRACTICE_RECORD_STORAGE_KEY)
}

function getDefaultStudyStats(): StudyStatsState {
  return {
    dailyRecords: []
  }
}

export function getStudyStats(): StudyStatsState {
  try {
    return Taro.getStorageSync(STUDY_STATS_STORAGE_KEY) || getDefaultStudyStats()
  } catch (error) {
    return getDefaultStudyStats()
  }
}

export function setStudyStats(stats: StudyStatsState) {
  Taro.setStorageSync(STUDY_STATS_STORAGE_KEY, stats)
}

export function upsertDailyStudyRecord(recordDate: string, payload: {
  practicedCount: number
  correctCount: number
  wrongCount: number
  durationSeconds?: number
}) {
  const stats = getStudyStats()
  const dailyRecords = [...stats.dailyRecords]
  const existingIndex = dailyRecords.findIndex((item) => item.date === recordDate)

  if (existingIndex >= 0) {
    const current = dailyRecords[existingIndex]
    dailyRecords[existingIndex] = {
      ...current,
      practicedCount: current.practicedCount + payload.practicedCount,
      correctCount: current.correctCount + payload.correctCount,
      wrongCount: current.wrongCount + payload.wrongCount,
      durationSeconds: (current.durationSeconds || 0) + (payload.durationSeconds || 0)
    }
  } else {
    const nextRecord: StudyDailyRecord = {
      date: recordDate,
      practicedCount: payload.practicedCount,
      correctCount: payload.correctCount,
      wrongCount: payload.wrongCount,
      durationSeconds: payload.durationSeconds
    }
    dailyRecords.push(nextRecord)
  }

  const nextStats: StudyStatsState = {
    dailyRecords: dailyRecords.sort((left, right) => left.date.localeCompare(right.date)),
    lastPracticeDate: recordDate
  }

  setStudyStats(nextStats)
  return nextStats
}

export function clearStudyStats() {
  Taro.removeStorageSync(STUDY_STATS_STORAGE_KEY)
}

export function getWrongBookItems(): WrongBookItem[] {
  try {
    return Taro.getStorageSync(WRONG_BOOK_STORAGE_KEY) || []
  } catch (error) {
    return []
  }
}

export function setWrongBookItems(items: WrongBookItem[]) {
  Taro.setStorageSync(WRONG_BOOK_STORAGE_KEY, items)
}

export function recordWrongBookItem(payload: {
  vocabularyId: string
  word: string
  meaning: string
  answeredAt: string
}) {
  const items = [...getWrongBookItems()]
  const currentIndex = items.findIndex((item) => item.vocabularyId === payload.vocabularyId)

  if (currentIndex >= 0) {
    const current = items[currentIndex]
    items[currentIndex] = {
      ...current,
      word: payload.word,
      meaning: payload.meaning,
      wrongCount: current.wrongCount + 1,
      lastWrongAt: payload.answeredAt,
      resolved: false
    }
  } else {
    items.push({
      vocabularyId: payload.vocabularyId,
      word: payload.word,
      meaning: payload.meaning,
      wrongCount: 1,
      firstWrongAt: payload.answeredAt,
      lastWrongAt: payload.answeredAt,
      resolved: false
    })
  }

  setWrongBookItems(items)
  return items
}

export function resolveWrongBookItem(vocabularyId: string) {
  const items = getWrongBookItems().map((item) => (
    item.vocabularyId === vocabularyId
      ? { ...item, resolved: true }
      : item
  ))
  setWrongBookItems(items)
  return items
}

export function clearWrongBookItems() {
  Taro.removeStorageSync(WRONG_BOOK_STORAGE_KEY)
}

export function clearAllStudyData() {
  clearVocabularyItems()
  clearPracticeRecords()
  clearStudyStats()
  clearWrongBookItems()
}

function normalizePracticeCount(count: number) {
  if (!Number.isFinite(count)) return 10
  return Math.min(Math.max(Math.floor(count), 1), 50)
}

export function getDefaultPracticeCount() {
  try {
    const count = Taro.getStorageSync(DEFAULT_PRACTICE_COUNT_STORAGE_KEY)
    return normalizePracticeCount(Number(count || 10))
  } catch (error) {
    return 10
  }
}

export function setDefaultPracticeCount(count: number) {
  const nextCount = normalizePracticeCount(count)
  Taro.setStorageSync(DEFAULT_PRACTICE_COUNT_STORAGE_KEY, nextCount)
  return nextCount
}
