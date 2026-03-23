import { View, Text } from '@tarojs/components'
import { useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import {
  appendPracticeRecord,
  getDefaultPracticeCount,
  getVocabularyItems,
  recordWrongBookItem,
  updateVocabularyPracticeResult,
  upsertDailyStudyRecord
} from '../../utils/storage'
import type { VocabularyItem } from '../../types/vocabulary'
import './index.scss'

type OptionKey = 'A' | 'B' | 'C' | 'D'

interface QuestionOption {
  key: OptionKey
  text: string
}

interface PracticeQuestion {
  id: string
  vocabularyId: string
  word: string
  meaning: string
  stem: string
  tip: string
  explanation: string
  answer: OptionKey
  options: QuestionOption[]
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

function shuffleArray<T>(list: T[]): T[] {
  const next = [...list]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[randomIndex]
    next[randomIndex] = current
  }
  return next
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function pickQuestionItems(vocabularyItems: VocabularyItem[], practiceCount: number) {
  return shuffleArray(vocabularyItems).slice(0, Math.min(practiceCount, vocabularyItems.length))
}

function buildQuestion(item: VocabularyItem, vocabularyItems: VocabularyItem[]): PracticeQuestion {
  const distractors = shuffleArray(
    vocabularyItems.filter((entry) => entry.id !== item.id && entry.meaning.trim() && entry.meaning !== item.meaning)
  ).slice(0, 3)

  const optionTexts = shuffleArray([item.meaning, ...distractors.map((entry) => entry.meaning)])
  const options = OPTION_KEYS.map((key, index) => ({
    key,
    text: optionTexts[index]
  }))

  const answer = options.find((option) => option.text === item.meaning)?.key ?? 'A'

  return {
    id: item.id,
    vocabularyId: item.id,
    word: item.word,
    meaning: item.meaning,
    stem: `请选择“${item.word}”的正确释义`,
    tip: '根据你导入的词汇随机生成',
    explanation: `${item.word}：${item.meaning}`,
    answer,
    options
  }
}

function buildQuestions(vocabularyItems: VocabularyItem[], practiceCount: number) {
  return pickQuestionItems(vocabularyItems, practiceCount).map((item) => buildQuestion(item, vocabularyItems))
}

export default function Practice() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([])
  const [practiceCount, setPracticeCount] = useState(getDefaultPracticeCount())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<OptionKey | null>(null)
  const [finished, setFinished] = useState(false)
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0)
  const [sessionWrongCount, setSessionWrongCount] = useState(0)
  const [sessionSynced, setSessionSynced] = useState(false)

  useDidShow(() => {
    setVocabularyItems(getVocabularyItems().filter((item) => item.word.trim() && item.meaning.trim()))
    setPracticeCount(getDefaultPracticeCount())
    setCurrentIndex(0)
    setSelected(null)
    setFinished(false)
    setSessionCorrectCount(0)
    setSessionWrongCount(0)
    setSessionSynced(false)
  })

  const questions = useMemo(() => buildQuestions(vocabularyItems, practiceCount), [vocabularyItems, practiceCount])
  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? `${currentIndex + 1} / ${questions.length}` : '0 / 0'

  const syncTodayStudyStats = (correctCount: number, wrongCount: number) => {
    if (sessionSynced) return
    upsertDailyStudyRecord(getDateKey(), {
      practicedCount: correctCount + wrongCount,
      correctCount,
      wrongCount
    })
    setSessionSynced(true)
  }

  const handleSelect = (key: OptionKey) => {
    if (selected || !currentQuestion || finished) return

    const isCorrect = key === currentQuestion.answer
    const answeredAt = new Date().toISOString()

    setSelected(key)
    setSessionCorrectCount((value) => value + (isCorrect ? 1 : 0))
    setSessionWrongCount((value) => value + (isCorrect ? 0 : 1))

    appendPracticeRecord({
      id: `${currentQuestion.vocabularyId}-${answeredAt}`,
      vocabularyId: currentQuestion.vocabularyId,
      word: currentQuestion.word,
      isCorrect,
      selectedOption: key,
      correctOption: currentQuestion.answer,
      answeredAt
    })

    updateVocabularyPracticeResult(currentQuestion.vocabularyId, isCorrect)

    if (!isCorrect) {
      recordWrongBookItem({
        vocabularyId: currentQuestion.vocabularyId,
        word: currentQuestion.word,
        meaning: currentQuestion.meaning,
        answeredAt
      })
    }
  }

  const handleNext = () => {
    if (!currentQuestion) {
      Taro.navigateBack()
      return
    }

    if (!selected) {
      Taro.showToast({ title: '请先选择答案', icon: 'none' })
      return
    }

    if (currentIndex === questions.length - 1) {
      syncTodayStudyStats(sessionCorrectCount, sessionWrongCount)
      setFinished(true)
      Taro.showToast({ title: '练习完成，数据已同步', icon: 'success' })
      return
    }

    setCurrentIndex((value) => value + 1)
    setSelected(null)
  }

  const handleBackToImport = () => {
    Taro.navigateTo({ url: '/pages/vocabulary-import/index' })
  }

  const getOptionClassName = (key: OptionKey) => {
    if (!selected) return 'option-item'
    if (key === currentQuestion.answer) return 'option-item option-item--correct'
    if (key === selected && key !== currentQuestion.answer) return 'option-item option-item--wrong'
    return 'option-item option-item--disabled'
  }

  if (vocabularyItems.length < 4) {
    return (
      <View className='page-shell practice-page'>
        <View className='card explanation-card practice-empty'>
          <Text className='practice-title'>还不能开始练习</Text>
          <Text className='explanation-text'>
            四选一练习至少需要 4 条已导入词汇。当前词库数量不足，先去导入更多 TXT 词条吧。
          </Text>
          <View className='next-button' onClick={handleBackToImport}>
            <Text className='next-button-text'>去导入词汇</Text>
          </View>
        </View>
      </View>
    )
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <View className='page-shell practice-page'>
      <View className='practice-header'>
        <Text className='practice-title'>成语练习</Text>
        <Text className='practice-progress'>{progress}</Text>
      </View>

      <View className='progress-track'>
        <View
          className='progress-fill'
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </View>

      <View className='card question-card'>
        <Text className='question-stem'>{finished ? '本轮练习已完成' : currentQuestion.stem}</Text>
        <Text className='question-tip'>
          {finished
            ? `本次完成 ${questions.length} 题，答对 ${sessionCorrectCount} 题，答错 ${sessionWrongCount} 题。`
            : `本轮按 ${questions.length} 题生成，${currentQuestion.tip}`}
        </Text>
      </View>

      {!finished && (
        <View className='options-list'>
          {currentQuestion.options.map((option) => (
            <View
              className={getOptionClassName(option.key)}
              key={option.key}
              onClick={() => handleSelect(option.key)}
            >
              <View className='option-key'>
                <Text className='option-key-text'>{option.key}</Text>
              </View>
              <Text className='option-text'>{option.text}</Text>
            </View>
          ))}
        </View>
      )}

      <View className='card explanation-card'>
        <Text className='explanation-title'>解析</Text>
        <Text className='explanation-text'>
          {finished
            ? '练习记录、错题本和今日学习统计都已经同步到本地，可在“我的”页面查看。'
            : selected
              ? currentQuestion.explanation
              : '作答后会在这里展示对应词语的释义。'}
        </Text>
      </View>

      <View className='next-button' onClick={finished ? () => Taro.navigateBack() : handleNext}>
        <Text className='next-button-text'>
          {finished ? '返回首页' : currentIndex === questions.length - 1 ? '完成练习' : '下一题'}
        </Text>
      </View>
    </View>
  )
}
