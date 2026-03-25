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
import './index.scss'

const presetCounts = [5, 10, 20, 30]

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
    <View className='page-shell home-page'>
      <View className='hero-card card'>
        <View className='hero-top'>
          <View>
            <Text className='hero-title'>词汇积累</Text>
            <Text className='hero-subtitle'>导入你的 TXT 词库，再通过四选一练习不断巩固。</Text>
          </View>
          <View className='streak-badge'>
            <Text className='streak-day'>已收录 {vocabularyItems.length} 条</Text>
          </View>
        </View>

        <View className='practice-panel'>
          <View>
            <Text className='panel-title'>今日练习</Text>
            <Text className='panel-desc'>
              {vocabularyItems.length > 0
                ? `当前词库 ${vocabularyItems.length} 条，已掌握 ${masteredCount} 条，今天已练 ${todayPracticedCount} 题`
                : '词库为空，先导入一批词汇后再开始练习。'}
            </Text>
          </View>
          <View className='primary-button' onClick={handleStartPractice}>
            <Text className='primary-button-text'>{vocabularyItems.length > 0 ? '开始练习' : '去导入词库'}</Text>
          </View>

          <View className='inline-count-panel'>
            <View className='inline-count-header'>
              <Text className='inline-count-title'>练习题数设置</Text>
              <Text className='inline-count-desc'>修改后全局生效，直到再次调整</Text>
            </View>

            <View className='inline-count-grid'>
              {presetCounts.map((count) => (
                <View
                  className={count === selectedPracticeCount ? 'inline-chip inline-chip--active' : 'inline-chip'}
                  key={count}
                  onClick={() => handleSelectPracticeCount(count)}
                >
                  <Text className={count === selectedPracticeCount ? 'inline-chip-text inline-chip-text--active' : 'inline-chip-text'}>
                    {count}题
                  </Text>
                </View>
              ))}
            </View>

            <View className='inline-custom-row'>
              <Text className='inline-custom-label'>自定义</Text>
              <Input
                className='inline-custom-input'
                type='number'
                maxlength={2}
                value={customCount}
                placeholder='1-50'
                onInput={(event) => handleCustomCountInput(event.detail.value)}
              />
              <Text className='inline-custom-suffix'>题</Text>
            </View>
          </View>
        </View>
      </View>

      <View className='quick-grid'>
        <View className='quick-card card' onClick={handleGoImport}>
          <Text className='quick-title'>导入词汇</Text>
          <Text className='quick-desc'>支持 TXT 文件与文本粘贴导入</Text>
        </View>
        <View className='quick-card card' onClick={handleGoWrongBook}>
          <Text className='quick-title'>错题本</Text>
          <Text className='quick-desc'>进入错题练习，答对后会从错题本中移除</Text>
        </View>
      </View>

      <View className='card overview-card'>
        <View className='section-row'>
          <Text className='section-title'>学习总览</Text>
          <Text className='section-subtitle'>累计学习 {studyDays} 天</Text>
        </View>

        <View className='overview-grid'>
          {learningOverview.map((item) => (
            <View className='overview-item' key={item.label}>
              <Text className='overview-value'>{item.value}</Text>
              <Text className='overview-label'>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
