export interface PracticeRecord {
  id: string
  vocabularyId: string
  word: string
  isCorrect: boolean
  selectedOption: string
  correctOption: string
  answeredAt: string
  source?: 'normal' | 'wrong_book'
}

export interface StudyDailyRecord {
  date: string
  practicedCount: number
  correctCount: number
  wrongCount: number
  durationSeconds?: number
}

export interface StudyStatsState {
  dailyRecords: StudyDailyRecord[]
  lastPracticeDate?: string
}

export interface WrongBookItem {
  vocabularyId: string
  word: string
  meaning: string
  wrongCount: number
  firstWrongAt: string
  lastWrongAt: string
  resolved: boolean
}
