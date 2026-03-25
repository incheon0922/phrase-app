import { View, Text } from '@tarojs/components'
import { useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import {
  appendPracticeRecord,
  getVocabularyItems,
  getWrongBookItems,
  recordWrongBookItem,
  resolveWrongBookItem,
  updateVocabularyPracticeResult
} from '../../utils/storage'
import type { WrongBookItem } from '../../types/study'
import type { VocabularyItem } from '../../types/vocabulary'
import './index.scss'

type OptionKey = 'A' | 'B' | 'C' | 'D'

interface QuestionOption {
  key: OptionKey
  text: string
}

interface WrongBookQuestion {
  id: string
  vocabularyId: string
  word: string
  meaning: string
  wrongCount: number
  answer: OptionKey
  options: QuestionOption[]
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

function shuffleArray<T>(list: T[]) {
  const next = [...list]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[randomIndex]
    next[randomIndex] = current
  }
  return next
}

function buildQuestion(item: WrongBookItem, vocabularyItems: VocabularyItem[]): WrongBookQuestion {
  const distractors = shuffleArray(
    vocabularyItems.filter((entry) => entry.id !== item.vocabularyId && entry.meaning.trim() && entry.meaning !== item.meaning)
  ).slice(0, 3)

  const optionTexts = shuffleArray([item.meaning, ...distractors.map((entry) => entry.meaning)])
  const options = OPTION_KEYS.map((key, index) => ({
    key,
    text: optionTexts[index]
  }))
  const answer = options.find((option) => option.text === item.meaning)?.key ?? 'A'

  return {
    id: item.vocabularyId,
    vocabularyId: item.vocabularyId,
    word: item.word,
    meaning: item.meaning,
    wrongCount: item.wrongCount,
    answer,
    options
  }
}

export default function WrongBookPractice() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([])
  const [wrongBookItems, setWrongBookItems] = useState<WrongBookItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<OptionKey | null>(null)
  const [finished, setFinished] = useState(false)
  const [resolvedCount, setResolvedCount] = useState(0)

  useDidShow(() => {
    setVocabularyItems(getVocabularyItems().filter((item) => item.word.trim() && item.meaning.trim()))
    setWrongBookItems(getWrongBookItems().filter((item) => !item.resolved))
    setCurrentIndex(0)
    setSelected(null)
    setFinished(false)
    setResolvedCount(0)
  })

  const questions = useMemo(
    () => wrongBookItems.map((item) => buildQuestion(item, vocabularyItems)),
    [vocabularyItems, wrongBookItems]
  )

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? `${currentIndex + 1} / ${questions.length}` : '0 / 0'

  const getOptionClassName = (key: OptionKey) => {
    if (!selected) return 'option-item'
    if (key === currentQuestion.answer) return 'option-item option-item--correct'
    if (key === selected && key !== currentQuestion.answer) return 'option-item option-item--wrong'
    return 'option-item option-item--disabled'
  }

  const handleSelect = (key: OptionKey) => {
    if (selected || !currentQuestion || finished) return

    const isCorrect = key === currentQuestion.answer
    const answeredAt = new Date().toISOString()

    setSelected(key)
    appendPracticeRecord({
      id: `${currentQuestion.vocabularyId}-${answeredAt}`,
      vocabularyId: currentQuestion.vocabularyId,
      word: currentQuestion.word,
      isCorrect,
      selectedOption: key,
      correctOption: currentQuestion.answer,
      answeredAt,
      source: 'wrong_book'
    })
    updateVocabularyPracticeResult(currentQuestion.vocabularyId, isCorrect)

    if (isCorrect) {
      resolveWrongBookItem(currentQuestion.vocabularyId)
      setResolvedCount((value) => value + 1)
      return
    }

    recordWrongBookItem({
      vocabularyId: currentQuestion.vocabularyId,
      word: currentQuestion.word,
      meaning: currentQuestion.meaning,
      answeredAt
    })
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
      setFinished(true)
      Taro.showToast({ title: '错题练习已完成', icon: 'success' })
      return
    }

    setCurrentIndex((value) => value + 1)
    setSelected(null)
  }

  if (wrongBookItems.length === 0) {
    return (
      <View className='page-shell practice-page'>
        <View className='card explanation-card practice-empty'>
          <Text className='practice-title'>暂无错题</Text>
          <Text className='explanation-text'>当前没有需要复习的错题，先去做几轮练习吧。</Text>
          <View className='next-button' onClick={() => Taro.navigateBack()}>
            <Text className='next-button-text'>返回首页</Text>
          </View>
        </View>
      </View>
    )
  }

  if (vocabularyItems.length < 4) {
    return (
      <View className='page-shell practice-page'>
        <View className='card explanation-card practice-empty'>
          <Text className='practice-title'>暂不能开始错题练习</Text>
          <Text className='explanation-text'>
            当前词库不足 4 条，无法生成四选一错题练习，请先导入更多词汇。
          </Text>
          <View className='next-button' onClick={() => Taro.navigateTo({ url: '/pages/vocabulary-import/index' })}>
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
        <Text className='practice-title'>错题练习</Text>
        <Text className='practice-progress'>{progress}</Text>
      </View>

      <View className='progress-track'>
        <View className='progress-fill' style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </View>

      <View className='card question-card'>
        <Text className='question-stem'>
          {finished ? '本轮错题练习已完成' : `请选择“${currentQuestion.word}”的正确释义`}
        </Text>
        <Text className='question-tip'>
          {finished
            ? `本次共处理 ${questions.length} 条错题，已成功解决 ${resolvedCount} 条。`
            : `该词已累计答错 ${currentQuestion.wrongCount} 次，答对后将从错题本中移除。`}
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
            ? '本轮错题复习已结束，答对的词条会被标记为已解决，未答对的词条会继续留在错题本中。'
            : selected
              ? `${currentQuestion.word}：${currentQuestion.meaning}`
              : '作答后，这里会显示对应词汇的正确释义。'}
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
