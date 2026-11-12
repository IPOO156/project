import { describe, expect, it } from 'vitest'
import {
  buildArchiveDetailEntries,
  formatArchiveValue,
  translateArchiveEnum,
} from '@/shared/utils/archiveDetailDisplay'

describe('translateArchiveEnum', () => {
  it('把后端英文枚举码翻译为中文', () => {
    expect(translateArchiveEnum('competitionType', 'academic')).toBe('学科类')
    expect(translateArchiveEnum('awardLevel', 'special')).toBe('特等奖')
    expect(translateArchiveEnum('competitionLevel', 'provincial')).toBe('省部级')
  })

  it('未知字段或未知值返回 null', () => {
    expect(translateArchiveEnum('competitionName', '数学')).toBeNull()
    expect(translateArchiveEnum('awardLevel', 'unknown-code')).toBeNull()
    expect(translateArchiveEnum('awardLevel', null)).toBeNull()
  })
})

describe('formatArchiveValue', () => {
  it('附件字段只展示文件名，不输出 fileUrl 与上传结构', () => {
    const value = JSON.stringify([
      {
        fileId: 94,
        fileName: 'a_preview.jpg',
        fileUrl: 'https://oss.example.com/a.jpg?signature=xxx',
      },
    ])
    expect(formatArchiveValue('proofFiles', value)).toBe('a_preview.jpg')
    expect(formatArchiveValue('proofFiles', value)).not.toContain('signature')
  })

  it('空值展示为 -，枚举字段走字典翻译', () => {
    expect(formatArchiveValue('participantRole', null)).toBe('-')
    expect(formatArchiveValue('competitionType', 'academic')).toBe('学科类')
  })
})

describe('buildArchiveDetailEntries', () => {
  it('成对字段只保留一行，并隐藏空值', () => {
    const entries = buildArchiveDetailEntries({
      competitionName: '数学',
      competitionType: 'academic',
      competitionTypeLabel: '学科类',
      awardLevel: 'special',
      awardLevelLabel: '特等奖',
      participantRole: null,
      proofFiles: '[]',
    })
    expect(entries.map((item) => item.key)).toEqual([
      'competitionName',
      'competitionType',
      'awardLevel',
    ])
    expect(entries.map((item) => item.label)).toEqual(['竞赛名称', '竞赛类型', '获奖等级'])
  })

  it('前端无法翻译但后端给了 Label 时保留 Label 行', () => {
    const entries = buildArchiveDetailEntries({
      customType: 'legacy_code',
      customTypeLabel: '旧类型',
    })
    expect(entries).toHaveLength(1)
    expect(entries[0]?.key).toBe('customTypeLabel')
    // 字典未收录该字段，行标题只能回落到原始 key
    expect(entries[0]?.label).toBe('customTypeLabel')
  })
})
