import { View, Text } from '@tarojs/components'
import { useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import {
  appendPracticeRecord,
  getDefaultPracticeCount,
  getPracticeRecords,
  getVocabularyItems,
  recordWrongBookItem,
  updateVocabularyPracticeResult,
  upsertDailyStudyRecord
} from '../../utils/storage'
import type { PracticeRecord } from '../../types/study'
import type { VocabularyItem } from '../../types/vocabulary'

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
const pageShellClass = 'min-h-screen px-[24rpx] pt-[28rpx] pb-[calc(48rpx+env(safe-area-inset-bottom))] bg-[radial-gradient(circle_at_top_right,rgba(57,185,138,0.05),transparent_24%),linear-gradient(180deg,#fcfffe_0%,#fbfffd_100%)] flex flex-col gap-[26rpx]'
const cardClass = 'overflow-hidden bg-[#fcfffd] border-[2rpx] border-[rgba(21,24,22,0.06)] rounded-[32rpx] shadow-[0_18rpx_44rpx_rgba(21,24,22,0.05)]'
const titleClass = 'text-[42rpx] font-extrabold text-[#141414]'
const explanationTextClass = 'mt-[14rpx] block text-[26rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'
const nextButtonClass = 'flex min-h-[88rpx] w-full items-center justify-center rounded-[24rpx] bg-[linear-gradient(135deg,#4bc897_0%,#39b98a_100%)] shadow-[0_14rpx_28rpx_rgba(57,185,138,0.18)]'
const nextButtonTextClass = 'text-[30rpx] font-extrabold text-white'
const optionBaseClass = 'flex min-h-[108rpx] items-center gap-[18rpx] rounded-[24rpx] border-[2rpx] px-[24rpx] py-[22rpx] shadow-[0_10rpx_20rpx_rgba(21,24,22,0.03)]'

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

function getTodayPracticeVocabularyIds(records: PracticeRecord[], dateKey: string) {
  return new Set(
    records
      .filter((record) => record.answeredAt.startsWith(dateKey))
      .map((record) => record.vocabularyId)
  )
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
    tip: '根据词库内容随机生成四选一题目',
    explanation: `${item.word}：${item.meaning}`,
    answer,
    options
  }
}

function buildQuestions(vocabularyItems: VocabularyItem[], practiceCount: number) {
  return shuffleArray(vocabularyItems)
    .slice(0, Math.min(practiceCount, vocabularyItems.length))
    .map((item) => buildQuestion(item, vocabularyItems))
}

export default function Practice() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([])
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([])
  const [practiceCount, setPracticeCount] = useState(getDefaultPracticeCount())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<OptionKey | null>(null)
  const [finished, setFinished] = useState(false)
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0)
  const [sessionWrongCount, setSessionWrongCount] = useState(0)
  const [sessionSynced, setSessionSynced] = useState(false)

  useDidShow(() => {
    setVocabularyItems(getVocabularyItems().filter((item) => item.word.trim() && item.meaning.trim()))
    setPracticeRecords(getPracticeRecords())
    setPracticeCount(getDefaultPracticeCount())
    setCurrentIndex(0)
    setSelected(null)
    setFinished(false)
    setSessionCorrectCount(0)
    setSessionWrongCount(0)
    setSessionSynced(false)
  })

  const questions = useMemo(() => {
    const todayVocabularyIds = getTodayPracticeVocabularyIds(practiceRecords, getDateKey())
    const availableItems = vocabularyItems.filter((item) => !todayVocabularyIds.has(item.id))
    return buildQuestions(availableItems, practiceCount)
  }, [practiceCount, practiceRecords, vocabularyItems])

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
      answeredAt,
      source: 'normal'
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
    if (!selected) return `${optionBaseClass} border-[rgba(20,20,20,0.06)] bg-white`
    if (key === currentQuestion.answer) return `${optionBaseClass} border-[rgba(57,185,138,0.32)] bg-[rgba(57,185,138,0.14)] shadow-[0_12rpx_24rpx_rgba(57,185,138,0.10)]`
    if (key === selected && key !== currentQuestion.answer) return `${optionBaseClass} border-[rgba(20,20,20,0.12)] bg-[#f2f3ef]`
    return `${optionBaseClass} border-[rgba(20,20,20,0.06)] bg-white opacity-70`
  }

  if (vocabularyItems.length < 4) {
    return (
      <View className={pageShellClass}>
        <View className={`${cardClass} flex min-h-[520rpx] flex-col items-center justify-center bg-[linear-gradient(180deg,#ffffff,#fcfffd)] p-[28rpx] text-center`}>
          <Text className='text-[38rpx] font-extrabold text-[#141414]'>还不能开始练习</Text>
          <Text className={explanationTextClass}>
            四选一练习至少需要 4 条已导入词汇。当前词库数量不足，先去导入更多词汇吧。
          </Text>
          <View className={`${nextButtonClass} mt-[28rpx]`} onClick={handleBackToImport}>
            <Text className={nextButtonTextClass}>去导入词库</Text>
          </View>
        </View>
      </View>
    )
  }

  if (!currentQuestion) {
    return (
      <View className={pageShellClass}>
        <View className={`${cardClass} flex min-h-[520rpx] flex-col items-center justify-center bg-[linear-gradient(180deg,#ffffff,#fcfffd)] p-[28rpx] text-center`}>
          <Text className='text-[38rpx] font-extrabold text-[#141414]'>今日已练完</Text>
          <Text className={explanationTextClass}>
            今天可用的词汇已经练习完成，系统不会重复抽取当日做过的词条。明天再来，或先导入更多新词汇。
          </Text>
          <View className={`${nextButtonClass} mt-[28rpx]`} onClick={() => Taro.navigateBack()}>
            <Text className={nextButtonTextClass}>返回首页</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className={pageShellClass}>
      <View className='flex items-center justify-between gap-[24rpx] px-[6rpx] pb-[4rpx] pt-[12rpx]'>
        <Text className={titleClass}>词汇练习</Text>
        <Text className='shrink-0 rounded-full border-[2rpx] border-[rgba(57,185,138,0.24)] bg-[rgba(57,185,138,0.12)] px-[18rpx] py-[10rpx] text-[24rpx] text-[#2d9a72] shadow-[inset_0_0_0_2rpx_rgba(255,255,255,0.32)]'>{progress}</Text>
      </View>

      <View className='h-[16rpx] overflow-hidden rounded-full bg-[rgba(20,20,20,0.08)]'>
        <View className='h-full rounded-full bg-[linear-gradient(90deg,#4bc897_0%,#39b98a_100%)]' style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </View>

      <View className={`${cardClass} bg-[linear-gradient(180deg,#ffffff,#fcfffd)] px-[30rpx] py-[36rpx]`}>
        <Text className='block text-[38rpx] font-extrabold leading-[1.55] text-[#141414]'>{finished ? '本轮练习已完成' : currentQuestion.stem}</Text>
        <Text className='mt-[16rpx] block text-[24rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'>
          {finished
            ? `本次完成 ${questions.length} 题，答对 ${sessionCorrectCount} 题，答错 ${sessionWrongCount} 题。`
            : `本轮按 ${questions.length} 题生成，${currentQuestion.tip}`}
        </Text>
      </View>

      {!finished && (
        <View className='flex flex-col gap-[18rpx]'>
          {currentQuestion.options.map((option) => (
            <View
              className={getOptionClassName(option.key)}
              key={option.key}
              onClick={() => handleSelect(option.key)}
            >
              <View className='flex h-[52rpx] w-[52rpx] shrink-0 items-center justify-center rounded-full bg-[rgba(57,185,138,0.14)]'>
                <Text className='text-[24rpx] font-extrabold text-[#2d9a72]'>{option.key}</Text>
              </View>
              <Text className='flex-1 text-[28rpx] leading-[1.5] text-[#141414]'>{option.text}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={`${cardClass} bg-[linear-gradient(180deg,#ffffff,#fcfffd)] p-[28rpx]`}>
        <Text className='block text-[28rpx] font-extrabold text-[#2d9a72]'>解析</Text>
        <Text className={explanationTextClass}>
          {finished
            ? '练习记录、错题本和今日学习统计都已经同步到本地，可在“我的”页面查看。'
            : selected
              ? currentQuestion.explanation
              : '作答后，这里会展示对应词汇的正确释义。'}
        </Text>
      </View>

      <View className={nextButtonClass} onClick={finished ? () => Taro.navigateBack() : handleNext}>
        <Text className={nextButtonTextClass}>{finished ? '返回首页' : currentIndex === questions.length - 1 ? '完成练习' : '下一题'}</Text>
      </View>
    </View>
  )
}
