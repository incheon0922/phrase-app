import { Input, View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import {
  clearAllStudyData,
  clearPracticeRecords,
  clearWrongBookItems,
  getDefaultPracticeCount,
  getPracticeRecords,
  getVocabularyItems,
  getWrongBookItems,
  setDefaultPracticeCount
} from '../../utils/storage'
import { getActiveWrongBookCount } from '../../utils/stats'
import type { PracticeRecord, WrongBookItem } from '../../types/study'
import type { VocabularyItem } from '../../types/vocabulary'

type ModalState = {
  visible: boolean
  title: string
  content: string
  confirmText: string
  showCancel: boolean
  danger?: boolean
  onConfirm?: () => void
}

const initialModalState: ModalState = {
  visible: false,
  title: '',
  content: '',
  confirmText: '知道了',
  showCancel: false
}

const pageShellClass = 'min-h-screen px-[24rpx] pt-[28rpx] pb-[calc(48rpx+env(safe-area-inset-bottom))] bg-[radial-gradient(circle_at_top_right,rgba(57,185,138,0.05),transparent_24%),linear-gradient(180deg,#fcfffe_0%,#fbfffd_100%)] flex flex-col gap-[26rpx]'
const cardClass = 'overflow-hidden bg-[#fcfffd] border-[2rpx] border-[rgba(21,24,22,0.06)] rounded-[32rpx] shadow-[0_18rpx_44rpx_rgba(21,24,22,0.05)] p-[28rpx]'
const titleClass = 'block text-[30rpx] font-extrabold text-[#141414]'
const descClass = 'mt-[14rpx] block text-[25rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'
const labelClass = 'text-[26rpx] text-[#141414]'
const statusClass = 'text-[24rpx] text-[rgba(20,20,20,0.62)]'
const chipClass = 'h-[72rpx] flex items-center justify-center rounded-[20rpx] border-[2rpx] border-[rgba(20,20,20,0.08)] bg-white'
const activeChipClass = 'h-[72rpx] flex items-center justify-center rounded-[20rpx] border-[2rpx] border-[#39b98a] bg-[rgba(57,185,138,0.14)] shadow-[0_10rpx_20rpx_rgba(57,185,138,0.12)]'
const chipTextClass = 'text-[24rpx] text-[rgba(20,20,20,0.62)]'
const activeChipTextClass = 'text-[24rpx] font-extrabold text-[#141414]'
const greenButtonClass = 'flex items-center justify-center bg-[linear-gradient(135deg,#4bc897_0%,#39b98a_100%)] shadow-[0_12rpx_24rpx_rgba(57,185,138,0.18)]'
const secondaryButtonClass = 'flex items-center justify-center border-[2rpx] border-[rgba(20,20,20,0.08)] bg-[linear-gradient(180deg,#f4faf7,#edf3ef)]'

export default function Mine() {
  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([])
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([])
  const [wrongBookItems, setWrongBookItems] = useState<WrongBookItem[]>([])
  const [defaultPracticeCount, setLocalDefaultPracticeCount] = useState(10)
  const [customPracticeCount, setCustomPracticeCount] = useState('')
  const [modalState, setModalState] = useState<ModalState>(initialModalState)

  useDidShow(() => {
    setVocabularyItems(getVocabularyItems())
    setPracticeRecords(getPracticeRecords())
    setWrongBookItems(getWrongBookItems())
    setLocalDefaultPracticeCount(getDefaultPracticeCount())
    setCustomPracticeCount('')
  })

  const wrongBookCount = getActiveWrongBookCount(wrongBookItems)

  const closeModal = () => {
    setModalState(initialModalState)
  }

  const openModal = (nextState: Omit<ModalState, 'visible'>) => {
    setModalState({
      visible: true,
      ...nextState
    })
  }

  const handleModalConfirm = () => {
    const nextAction = modalState.onConfirm
    closeModal()
    nextAction?.()
  }

  const handleAboutDeveloper = () => {
    openModal({
      title: '关于开发者',
      content: '开发者：eternal\n\n感谢使用这款词汇学习工具。',
      confirmText: '知道了',
      showCancel: false
    })
  }

  const handleSaveDefaultPracticeCount = (count: number) => {
    const nextCount = setDefaultPracticeCount(count)
    setLocalDefaultPracticeCount(nextCount)
    setCustomPracticeCount('')
    Taro.showToast({
      title: `默认题数已设为 ${nextCount} 题`,
      icon: 'success'
    })
  }

  const handleClearPracticeData = () => {
    openModal({
      title: '确认清空',
      content: '将清空练习记录与错题本数据，是否继续？',
      confirmText: '确认清空',
      showCancel: true,
      danger: true,
      onConfirm: () => {
        clearPracticeRecords()
        clearWrongBookItems()
        setPracticeRecords([])
        setWrongBookItems([])
        Taro.showToast({
          title: '练习数据已清空',
          icon: 'success'
        })
      }
    })
  }

  const handleClearAll = () => {
    openModal({
      title: '确认清空',
      content: '将清空全部本地学习数据，此操作不可恢复，是否继续？',
      confirmText: '全部清空',
      showCancel: true,
      danger: true,
      onConfirm: () => {
        clearAllStudyData()
        setVocabularyItems([])
        setPracticeRecords([])
        setWrongBookItems([])
        Taro.showToast({
          title: '本地学习数据已清空',
          icon: 'success'
        })
      }
    })
  }

  return (
    <View className={pageShellClass}>
      <View className={cardClass}>
        <Text className={titleClass}>练习题数设置</Text>
        <Text className={descClass}>首页开始练习前可临时调整，这里设置的是默认题数。</Text>

        <View className='mt-[24rpx] grid grid-cols-4 gap-[16rpx]'>
          {[5, 10, 20, 30].map((count) => (
            <View
              className={count === defaultPracticeCount ? activeChipClass : chipClass}
              key={count}
              onClick={() => handleSaveDefaultPracticeCount(count)}
            >
              <Text className={count === defaultPracticeCount ? activeChipTextClass : chipTextClass}>
                {count}题
              </Text>
            </View>
          ))}
        </View>

        <View className='mt-[24rpx] flex items-center gap-[16rpx]'>
          <Text className={labelClass}>自定义默认值</Text>
          <Input
            className='h-[72rpx] flex-1 rounded-[20rpx] border-[2rpx] border-[rgba(20,20,20,0.08)] bg-[linear-gradient(180deg,#ffffff,#fcfffd)] px-[18rpx] text-[26rpx] text-[#141414]'
            type='number'
            maxlength={2}
            value={customPracticeCount}
            placeholder='1-50'
            onInput={(event) => setCustomPracticeCount(event.detail.value.replace(/[^\d]/g, '').slice(0, 2))}
          />
          <View
            className={`${greenButtonClass} h-[72rpx] w-[112rpx] rounded-[20rpx]`}
            onClick={() => customPracticeCount && handleSaveDefaultPracticeCount(Number(customPracticeCount))}
          >
            <Text className='text-[24rpx] font-extrabold text-white'>保存</Text>
          </View>
        </View>
      </View>

      <View className={cardClass}>
        <Text className={titleClass}>错题本与记录</Text>
        <Text className={descClass}>错题本会按词条累计错误次数，后续也可以继续扩展成针对性复习。</Text>

        <View className='flex items-center justify-between gap-[16rpx] py-[18rpx]'>
          <Text className={labelClass}>当前错题数</Text>
          <Text className={statusClass}>{wrongBookCount} 条</Text>
        </View>
        <View className='flex items-center justify-between gap-[16rpx] py-[18rpx]'>
          <Text className={labelClass}>练习记录数</Text>
          <Text className={statusClass}>{practiceRecords.length} 条</Text>
        </View>
        <View className='flex items-center justify-between gap-[16rpx] py-[18rpx]'>
          <Text className={labelClass}>词汇总数</Text>
          <Text className={statusClass}>{vocabularyItems.length} 条</Text>
        </View>
      </View>

      <View className={cardClass}>
        <Text className={titleClass}>设置与数据管理</Text>
        <View className='flex items-center justify-between border-b-[2rpx] border-[rgba(20,20,20,0.06)] py-[26rpx]' onClick={handleAboutDeveloper}>
          <Text className='text-[28rpx] text-[#141414]'>关于我们</Text>
          <Text className='text-[34rpx] text-[#b5b8ad]'>›</Text>
        </View>
        <View className='flex items-center justify-between border-b-[2rpx] border-[rgba(20,20,20,0.06)] py-[26rpx]' onClick={handleClearPracticeData}>
          <Text className='text-[28rpx] text-[#141414]'>清空练习记录与错题本</Text>
          <Text className='text-[34rpx] text-[#b5b8ad]'>›</Text>
        </View>
        <View className='flex items-center justify-between pt-[26rpx]' onClick={handleClearAll}>
          <Text className='text-[28rpx] text-[#c14c44]'>清空全部本地学习数据</Text>
          <Text className='text-[34rpx] text-[#b5b8ad]'>›</Text>
        </View>
      </View>

      {modalState.visible && (
        <View className='fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(20,20,20,0.18)] p-[32rpx]' onClick={modalState.showCancel ? closeModal : undefined}>
          <View className='w-full max-w-[620rpx] rounded-[32rpx] bg-[linear-gradient(180deg,#ffffff,#f9fdfb)] px-[32rpx] pb-[30rpx] pt-[36rpx] shadow-[0_18rpx_36rpx_rgba(20,20,20,0.08)]' onClick={(event) => event.stopPropagation()}>
            <Text className='block text-center text-[32rpx] font-extrabold text-[#141414]'>{modalState.title}</Text>
            <Text className='mt-[18rpx] block whitespace-pre-line text-[26rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'>{modalState.content}</Text>

            <View className={modalState.showCancel ? 'mt-[30rpx] grid grid-cols-2 gap-[18rpx]' : 'mt-[30rpx] grid grid-cols-1 gap-[18rpx]'}>
              {modalState.showCancel && (
                <View className={`${secondaryButtonClass} h-[84rpx] rounded-[22rpx]`} onClick={closeModal}>
                  <Text className='text-[28rpx] font-extrabold text-[rgba(20,20,20,0.62)]'>取消</Text>
                </View>
              )}
              <View
                className={`${greenButtonClass} h-[84rpx] rounded-[22rpx]`}
                onClick={handleModalConfirm}
              >
                <Text className='text-[28rpx] font-extrabold text-white'>{modalState.confirmText}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
