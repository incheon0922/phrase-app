import { Button, Textarea, View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState } from 'react'
import { parseVocabularyText } from '../../utils/parser'
import { appendVocabularyItems } from '../../utils/storage'
import type { VocabularyItem } from '../../types/vocabulary'
import './index.scss'

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
    <View className='page-shell import-page'>
      <View className='card import-card'>
        <Text className='import-title'>导入方式</Text>
        <Text className='import-desc'>
          先支持 TXT 文件和文本粘贴，建议每行一个词条，格式如“白驹过隙：形容时间过得很快”。
        </Text>

        <Button className='import-primary' onClick={handleChooseTxt}>
          选择 TXT 文件
        </Button>
      </View>

      <View className='card import-card'>
        <Text className='import-title'>文本粘贴</Text>
        <Textarea
          className='import-textarea'
          maxlength={-1}
          value={rawText}
          placeholder={'示例：\n白驹过隙：形容时间过得很快\n不刊之论：不可更改的言论'}
          onInput={(event) => setRawText(event.detail.value)}
        />
        <Button className='import-secondary' onClick={handleParseText}>
          解析当前文本
        </Button>
      </View>

      <View className='card preview-card'>
        <View className='preview-header'>
          <Text className='import-title'>解析预览</Text>
          <Text className='preview-meta'>{sourceLabel} · 共 {parsedItems.length} 条</Text>
        </View>

        {previewItems.length > 0 ? (
          previewItems.map((item) => (
            <View className='preview-item' key={item.id}>
              <Text className='preview-word'>{item.word}</Text>
              <Text className='preview-meaning'>{item.meaning || '释义待补充'}</Text>
            </View>
          ))
        ) : (
          <Text className='preview-empty'>还没有可预览的词条，先选择 TXT 或粘贴文本。</Text>
        )}

        {parsedItems.length > previewItems.length && (
          <Text className='preview-more'>仅展示前 5 条，保存后会全部入库。</Text>
        )}
      </View>

      <Button className='save-button' onClick={handleSave}>
        保存到词库
      </Button>
    </View>
  )
}
