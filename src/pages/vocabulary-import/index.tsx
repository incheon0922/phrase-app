import { Button, Textarea, View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { parseVocabularyText } from '../../utils/parser'
import { appendVocabularyItems } from '../../utils/storage'
import type { VocabularyItem } from '../../types/vocabulary'

const pageShellClass = 'min-h-screen px-[24rpx] pt-[28rpx] pb-[calc(48rpx+env(safe-area-inset-bottom))] bg-[radial-gradient(circle_at_top_right,rgba(57,185,138,0.05),transparent_24%),linear-gradient(180deg,#fcfffe_0%,#fbfffd_100%)] flex flex-col gap-[26rpx]'
const cardClass = 'overflow-hidden bg-[#fcfffd] border-[2rpx] border-[rgba(21,24,22,0.06)] rounded-[32rpx] shadow-[0_18rpx_44rpx_rgba(21,24,22,0.05)] p-[28rpx]'
const titleClass = 'block text-[30rpx] font-extrabold text-[#141414]'
const descClass = 'mt-[14rpx] block text-[25rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'
const primaryButtonClass = 'mt-[24rpx] flex h-[88rpx] items-center justify-center rounded-[22rpx] bg-[linear-gradient(135deg,#4bc897_0%,#39b98a_100%)] text-[30rpx] font-extrabold text-white shadow-[0_14rpx_28rpx_rgba(57,185,138,0.18)]'
const secondaryButtonClass = 'mt-[24rpx] flex h-[88rpx] items-center justify-center rounded-[22rpx] border-[2rpx] border-[rgba(20,20,20,0.08)] bg-[linear-gradient(180deg,#f4faf7,#edf3ef)] text-[30rpx] font-extrabold text-[rgba(20,20,20,0.72)]'

function readLocalFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const fs = Taro.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'utf8',
      success: (res) => resolve(String(res.data ?? '')),
      fail: reject
    })
  })
}

export default function ImportPage() {
  const [rawText, setRawText] = useState('')
  const [parsedItems, setParsedItems] = useState<VocabularyItem[]>([])
  const [sourceLabel, setSourceLabel] = useState('尚未导入')

  const previewItems = useMemo(() => parsedItems.slice(0, 5), [parsedItems])

  const updatePreview = (content: string, source: 'txt' | 'manual') => {
    const items = parseVocabularyText(content, source)
    setRawText(content)
    setParsedItems(items)
    setSourceLabel(source === 'txt' ? 'TXT 文件' : '文本粘贴')
  }

  const handleChooseTxt = async () => {
    try {
      const result = await Taro.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['txt']
      })
      const file = result.tempFiles?.[0]
      if (!file?.path) {
        Taro.showToast({ title: '未选择文件', icon: 'none' })
        return
      }

      const content = await readLocalFile(file.path)
      updatePreview(content, 'txt')
      Taro.showToast({ title: 'TXT 读取成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: 'TXT 读取失败', icon: 'none' })
    }
  }

  const handleParseText = () => {
    const items = parseVocabularyText(rawText, 'manual')
    setParsedItems(items)
    setSourceLabel('文本粘贴')
    Taro.showToast({
      title: items.length > 0 ? `识别 ${items.length} 条` : '未识别到有效词条',
      icon: 'none'
    })
  }

  const handleSave = () => {
    if (parsedItems.length === 0) {
      Taro.showToast({ title: '请先导入或解析内容', icon: 'none' })
      return
    }

    const { addedCount, duplicatedCount } = appendVocabularyItems(parsedItems)
    Taro.showToast({
      title: `新增 ${addedCount} 条${duplicatedCount > 0 ? `，去重 ${duplicatedCount} 条` : ''}`,
      icon: 'none'
    })

    if (addedCount > 0) {
      Taro.navigateBack()
    }
  }

  return (
    <View className={pageShellClass}>
      <View className={cardClass}>
        <Text className={titleClass}>导入方式</Text>
        <Text className={descClass}>
          先支持 TXT 文件和文本粘贴，建议每行一个词条，格式如“白驹过隙：形容时间过得很快”。
        </Text>

        <Button className={primaryButtonClass} onClick={handleChooseTxt}>
          选择 TXT 文件
        </Button>
      </View>

      <View className={cardClass}>
        <Text className={titleClass}>文本粘贴</Text>
        <Textarea
          className='mt-[22rpx] min-h-[280rpx] w-full rounded-[24rpx] border-[2rpx] border-[rgba(20,20,20,0.08)] bg-[linear-gradient(180deg,#ffffff,#fcfffd)] p-[24rpx] text-[26rpx] leading-[1.7] text-[#141414]'
          maxlength={-1}
          value={rawText}
          placeholder={'示例：\n白驹过隙：形容时间过得很快\n不刊之论：不可更改的言论'}
          onInput={(event) => setRawText(event.detail.value)}
        />
        <Button className={secondaryButtonClass} onClick={handleParseText}>
          解析当前文本
        </Button>
      </View>

      <View className={cardClass}>
        <View className='flex items-baseline justify-between gap-[20rpx]'>
          <Text className={titleClass}>解析预览</Text>
          <Text className='text-[22rpx] text-[rgba(20,20,20,0.54)]'>{sourceLabel} · 共 {parsedItems.length} 条</Text>
        </View>

        {previewItems.length > 0 ? (
          previewItems.map((item) => (
            <View className='border-b-[2rpx] border-[rgba(20,20,20,0.06)] py-[22rpx] last:border-b-0' key={item.id}>
              <Text className='block text-[28rpx] font-extrabold text-[#141414]'>{item.word}</Text>
              <Text className='mt-[8rpx] block text-[25rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'>{item.meaning || '释义待补充'}</Text>
            </View>
          ))
        ) : (
          <Text className='mt-[18rpx] block text-[24rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'>还没有可预览的词条，先选择 TXT 或粘贴文本。</Text>
        )}

        {parsedItems.length > previewItems.length && (
          <Text className='mt-[18rpx] block text-[24rpx] leading-[1.7] text-[rgba(20,20,20,0.66)]'>仅展示前 5 条，保存后会全部入库。</Text>
        )}
      </View>

      <Button className={primaryButtonClass} onClick={handleSave}>
        保存到词库
      </Button>
    </View>
  )
}
