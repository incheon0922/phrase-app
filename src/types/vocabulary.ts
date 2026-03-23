export interface VocabularyItem {
  id: string
  word: string
  meaning: string
  source: 'txt' | 'manual'
  createdAt: string
  updatedAt: string
  masteryLevel: number
  wrongCount: number
  favorite: boolean
}
