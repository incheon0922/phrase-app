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
import './index.scss'

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
    <View className='page-shell mine-page'>
      <View className='card sync-card'>
        <Text className='card-title'>练习题数设置</Text>
        <Text className='card-desc'>首页开始练习前可临时调整，这里设置的是默认题数。</Text>

        <View className='practice-count-row'>
          {[5, 10, 20, 30].map((count) => (
            <View
              className={count === defaultPracticeCount ? 'count-chip count-chip--active' : 'count-chip'}
              key={count}
              onClick={() => handleSaveDefaultPracticeCount(count)}
            >
              <Text className={count === defaultPracticeCount ? 'count-chip-text count-chip-text--active' : 'count-chip-text'}>
                {count}题
              </Text>
            </View>
          ))}
        </View>

        <View className='custom-practice-row'>
          <Text className='sync-label'>自定义默认值</Text>
          <Input
            className='practice-input'
            type='number'
            maxlength={2}
            value={customPracticeCount}
            placeholder='1-50'
            onInput={(event) => setCustomPracticeCount(event.detail.value.replace(/[^\d]/g, '').slice(0, 2))}
          />
          <View
            className='practice-save-button'
            onClick={() => customPracticeCount && handleSaveDefaultPracticeCount(Number(customPracticeCount))}
          >
            <Text className='practice-save-button-text'>保存</Text>
          </View>
        </View>
      </View>

      <View className='card sync-card'>
        <Text className='card-title'>错题本与记录</Text>
        <Text className='card-desc'>错题本会按词条累计错误次数，后续也可以继续扩展成针对性复习。</Text>

        <View className='sync-item'>
          <Text className='sync-label'>当前错题数</Text>
          <Text className='sync-status'>{wrongBookCount} 条</Text>
        </View>
        <View className='sync-item'>
          <Text className='sync-label'>练习记录数</Text>
          <Text className='sync-status'>{practiceRecords.length} 条</Text>
        </View>
        <View className='sync-item'>
          <Text className='sync-label'>词汇总数</Text>
          <Text className='sync-status'>{vocabularyItems.length} 条</Text>
        </View>
      </View>

      <View className='card setting-card'>
        <Text className='card-title'>设置与数据管理</Text>
        <View className='setting-item' onClick={handleAboutDeveloper}>
          <Text className='setting-text'>关于我们</Text>
          <Text className='setting-arrow'>›</Text>
        </View>
        <View className='setting-item' onClick={handleClearPracticeData}>
          <Text className='setting-text'>清空练习记录与错题本</Text>
          <Text className='setting-arrow'>›</Text>
        </View>
        <View className='setting-item' onClick={handleClearAll}>
          <Text className='setting-text setting-text--danger'>清空全部本地学习数据</Text>
          <Text className='setting-arrow'>›</Text>
        </View>
      </View>

      {modalState.visible && (
        <View className='modal-mask' onClick={modalState.showCancel ? closeModal : undefined}>
          <View className='modal-card' onClick={(event) => event.stopPropagation()}>
            <Text className='modal-title'>{modalState.title}</Text>
            <Text className='modal-content'>{modalState.content}</Text>

            <View className={modalState.showCancel ? 'modal-actions' : 'modal-actions modal-actions--single'}>
              {modalState.showCancel && (
                <View className='modal-button modal-button--secondary' onClick={closeModal}>
                  <Text className='modal-button-text modal-button-text--secondary'>取消</Text>
                </View>
              )}
              <View
                className={modalState.danger ? 'modal-button modal-button--danger' : 'modal-button modal-button--primary'}
                onClick={handleModalConfirm}
              >
                <Text className='modal-button-text'>{modalState.confirmText}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
