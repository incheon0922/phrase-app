import type { VocabularyItem } from '../types/vocabulary'

const SEPARATORS = ['：', ':', '-', '——']

function splitWordLine(line: string): { word: string; meaning: string } | null {
  for (const separator of SEPARATORS) {
    const index = line.indexOf(separator)
    if (index > 0) {
      const word = line.slice(0, index).trim()
      const meaning = line.slice(index + separator.length).trim()
      if (word) {
        return { word, meaning }
      }
    }
  }

  const parts = line.trim().split(/\s+/)
  if (parts.length >= 2) {
    const [word, ...rest] = parts
    return {
      word: word.trim(),
      meaning: rest.join(' ').trim()
    }
  }

  return null
}

export function parseVocabularyText(rawText: string, source: 'txt' | 'manual'): VocabularyItem[] {
  const now = new Date().toISOString()

  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parsed = splitWordLine(line)
      if (!parsed) {
        return null
      }

      return {
        id: `${Date.now()}-${index}-${parsed.word}`,
        word: parsed.word,
        meaning: parsed.meaning,
        source,
        createdAt: now,
        updatedAt: now,
        masteryLevel: 0,
        wrongCount: 0,
        favorite: false
      }
    })
    .filter((item): item is VocabularyItem => Boolean(item))
}
