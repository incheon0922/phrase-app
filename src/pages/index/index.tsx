import { Input, View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import {
  getDefaultPracticeCount,
  getPracticeRecords,
  getStudyStats,
  getVocabularyItems,
  getWrongBookItems,
  setDefaultPracticeCount
} from '../../utils/storage'
import {
  calculateAccuracy,
  calculateCurrentStreak,
  calculateStudyDays,
  calculateTodayNormalPracticeCount,
  getActiveWrongBookCount,
  getTodayStudyRecord
} from '../../utils/stats'
import { applyThemeChrome } from '../../utils/theme'
import type { PracticeRecord, WrongBookItem } from '../../types/study'
import type { VocabularyItem } from '../../types/vocabulary'

const presetCounts = [5, 10, 20, 30]

const pageShellClass = 'min-h-screen px-[24rpx] pt-[28rpx] pb-[calc(48rpx+env(safe-area-inset-bottom))] bg-[radial-gradient(circle_at_top_right,rgba(57,185,138,0.05),transparent_24%),linear-gradient(180deg,#fcfffe_0%,#fbfffd_100%)] flex flex-col gap-[26rpx]'
const cardClass = 'overflow-hidden bg-[#fcfffd] border-[2rpx] border-[rgba(21,24,22,0.06)] rounded-[32rpx] shadow-[0_18rpx_44rpx_rgba(21,24,22,0.05)]'
const primaryButtonClass = 'mt-[28rpx] h-[88rpx] flex items-center justify-center rounded-[24rpx] bg-[linear-gradient(135deg,#47c796_0%,#39b98a_100%)] shadow-[0_14rpx_28rpx_rgba(57,185,138,0.18)]'
const primaryButtonTextClass = 'text-[30rpx] font-extrabold tracking-[1rpx] text-white'
const chipClass = 'h-[72rpx] flex items-center justify-center rounded-[20rpx] border-[2rpx] border-[rgba(20,20,20,0.08)] bg-[rgba(255,255,255,0.84)]'
const activeChipClass = 'h-[72rpx] flex items-center justify-center rounded-[20rpx] border-[2rpx] border-[#39b98a] bg-[#39b98a] shadow-[0_10rpx_20rpx_rgba(57,185,138,0.16)]'
const chipTextClass = 'text-[24rpx] text-[rgba(20,20,20,0.66)]'
const activeChipTextClass = 'text-[24rpx] text-white font-extrabold'

export default function Index() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([])
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([])
  const [wrongBookItems, setWrongBookItems] = useState<WrongBookItem[]>([])
  const [selectedPracticeCount, setSelectedPracticeCount] = useState(10)
  const [customCount, setCustomCount] = useState('')
  const [todayPracticedCount, setTodayPracticedCount] = useState(0)
  const [studyDays, setStudyDays] = useState(0)
  const [streakDays, setStreakDays] = useState(0)

  useDidShow(() => {
    const nextVocabularyItems = getVocabularyItems()
    const nextPracticeRecords = getPracticeRecords()
    const nextWrongBookItems = getWrongBookItems()
    const savedCount = getDefaultPracticeCount()
    const studyStats = getStudyStats()
    const todayRecord = getTodayStudyRecord(studyStats.dailyRecords)

    setVocabularyItems(nextVocabularyItems)
    setPracticeRecords(nextPracticeRecords)
    setWrongBookItems(nextWrongBookItems)
    setSelectedPracticeCount(savedCount)
    setCustomCount(presetCounts.includes(savedCount) ? '' : String(savedCount))
    setTodayPracticedCount(todayRecord?.practicedCount || 0)
    setStudyDays(calculateStudyDays(studyStats.dailyRecords))
    setStreakDays(calculateCurrentStreak(studyStats.dailyRecords))
    applyThemeChrome()
  })

  const handleStartPractice = () => {
    if (vocabularyItems.length === 0) {
      Taro.navigateTo({ url: '/pages/vocabulary-import/index' })
      return
    }

    Taro.navigateTo({ url: '/pages/practice/index' })
  }

  const handleGoImport = () => {
    Taro.navigateTo({ url: '/pages/vocabulary-import/index' })
  }

  const handleGoWrongBook = () => {
    Taro.navigateTo({ url: '/pages/wrong-book/index' })
  }

  const handleSelectPracticeCount = (count: number) => {
    const nextCount = setDefaultPracticeCount(count)
    setSelectedPracticeCount(nextCount)
    setCustomCount('')
  }

  const handleCustomCountInput = (value: string) => {
    const nextValue = value.replace(/[^\d]/g, '').slice(0, 2)
    setCustomCount(nextValue)
    if (!nextValue) return

    const parsed = Number(nextValue)
    if (parsed > 0) {
      const nextCount = setDefaultPracticeCount(parsed)
      setSelectedPracticeCount(nextCount)
    }
  }

  const masteredCount = vocabularyItems.filter((item) => item.masteryLevel >= 3).length
  const accuracy = calculateAccuracy(practiceRecords)
  const wrongBookCount = getActiveWrongBookCount(wrongBookItems)
  const todayNormalPracticeCount = calculateTodayNormalPracticeCount(practiceRecords)

  const learningOverview = [
    { label: '当日练习题数', value: String(todayNormalPracticeCount) },
    { label: '正确率', value: `${accuracy}%` },
    { label: '连续学习', value: `${streakDays} 天` },
    { label: '当前错题', value: String(wrongBookCount) }
  ]

  return (
    <View className={pageShellClass}>
      <View className={`${cardClass} p-[32rpx] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,255,253,0.98))]`}>
        <View className='flex items-start justify-between gap-[20rpx]'>
          <View>
            <Text className='block text-[48rpx] font-extrabold tracking-[1rpx] text-[#141414]'>词汇积累</Text>
            <Text className='mt-[14rpx] block max-w-[440rpx] text-[25rpx] leading-[1.7] text-[rgba(20,20,20,0.62)]'>导入你的 TXT 词库，再通过四选一练习不断巩固。</Text>
          </View>
          <View className='shrink-0 rounded-full border-[2rpx] border-[rgba(57,185,138,0.24)] bg-[rgba(57,185,138,0.10)] px-[22rpx] py-[14rpx] shadow-[inset_0_0_0_2rpx_rgba(255,255,255,0.34)]'>
            <Text className='text-[24rpx] font-bold text-[#2d9a72]'>已收录 {vocabularyItems.length} 条</Text>
          </View>
        </View>

        <View className='mt-[28rpx] rounded-[30rpx] border-[2rpx] border-[rgba(20,20,20,0.06)] bg-[linear-gradient(180deg,rgba(242,243,239,0.96),rgba(236,245,241,0.96))] px-[28rpx] py-[30rpx]'>
          <View>
            <Text className='block text-[32rpx] font-extrabold text-[#141414]'>今日练习</Text>
            <Text className='mt-[10rpx] block text-[24rpx] leading-[1.7] text-[rgba(20,20,20,0.64)]'>
              {vocabularyItems.length > 0
                ? `当前词库 ${vocabularyItems.length} 条，已掌握 ${masteredCount} 条，今天已练 ${todayPracticedCount} 题`
                : '词库为空，先导入一批词汇后再开始练习。'}
            </Text>
          </View>
          <View className={primaryButtonClass} onClick={handleStartPractice}>
            <Text className={primaryButtonTextClass}>{vocabularyItems.length > 0 ? '开始练习' : '去导入词库'}</Text>
          </View>

          <View className='mt-[24rpx] border-t-[2rpx] border-[rgba(20,20,20,0.06)] pt-[24rpx]'>
            <View className='flex items-baseline justify-between gap-[16rpx]'>
              <Text className='text-[28rpx] font-bold text-[#141414]'>练习题数设置</Text>
              <Text className='text-[22rpx] text-[rgba(20,20,20,0.52)]'>修改后全局生效，直到再次调整</Text>
            </View>

            <View className='mt-[18rpx] grid grid-cols-4 gap-[16rpx]'>
              {presetCounts.map((count) => (
                <View
                  className={count === selectedPracticeCount ? activeChipClass : chipClass}
                  key={count}
                  onClick={() => handleSelectPracticeCount(count)}
                >
                  <Text className={count === selectedPracticeCount ? activeChipTextClass : chipTextClass}>
                    {count}题
                  </Text>
                </View>
              ))}
            </View>

            <View className='mt-[18rpx] flex items-center gap-[16rpx]'>
              <Text className='text-[24rpx] text-[rgba(20,20,20,0.66)]'>自定义</Text>
              <Input
                className='h-[72rpx] flex-1 rounded-[20rpx] border-[2rpx] border-[rgba(20,20,20,0.08)] bg-white px-[18rpx] text-[26rpx] text-[#141414]'
                type='number'
                maxlength={2}
                value={customCount}
                placeholder='1-50'
                onInput={(event) => handleCustomCountInput(event.detail.value)}
              />
              <Text className='text-[24rpx] text-[rgba(20,20,20,0.66)]'>题</Text>
            </View>
          </View>
        </View>
      </View>

      <View className='grid grid-cols-2 gap-[20rpx]'>
        <View className={`${cardClass} min-h-[184rpx] flex flex-col justify-between bg-[linear-gradient(180deg,#ffffff,#fcfffd)] p-[24rpx]`} onClick={handleGoImport}>
          <Text className='text-[30rpx] font-extrabold text-[#141414]'>导入词汇</Text>
          <Text className='text-[24rpx] leading-[1.6] text-[rgba(20,20,20,0.66)]'>支持 TXT 文件与文本粘贴导入</Text>
        </View>
        <View className={`${cardClass} min-h-[184rpx] flex flex-col justify-between bg-[linear-gradient(180deg,#ffffff,#fcfffd)] p-[24rpx]`} onClick={handleGoWrongBook}>
          <Text className='text-[30rpx] font-extrabold text-[#141414]'>错题本</Text>
          <Text className='text-[24rpx] leading-[1.6] text-[rgba(20,20,20,0.66)]'>进入错题练习，答对后会从错题本中移除</Text>
        </View>
      </View>

      <View className={`${cardClass} bg-[linear-gradient(180deg,#ffffff,#fcfffd)] p-[28rpx]`}>
        <View className='flex items-center justify-between'>
          <Text className='text-[30rpx] font-extrabold text-[#141414]'>学习总览</Text>
          <Text className='text-[24rpx] text-[rgba(20,20,20,0.62)]'>累计学习 {studyDays} 天</Text>
        </View>

        <View className='mt-[24rpx] grid grid-cols-2 gap-[18rpx]'>
          {learningOverview.map((item) => (
            <View className='rounded-[24rpx] border-[2rpx] border-[rgba(20,20,20,0.06)] bg-[#f2f3ef] px-[20rpx] py-[24rpx] shadow-[inset_0_1rpx_0_rgba(255,255,255,0.6)]' key={item.label}>
              <Text className='block text-[36rpx] font-extrabold text-[#2d9a72]'>{item.value}</Text>
              <Text className='mt-[8rpx] block text-[24rpx] text-[rgba(20,20,20,0.62)]'>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
