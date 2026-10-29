import { describe, expect, it } from 'vitest'
import { statusLabel, statusOptions, statusTagType } from '@/features/teacher/archive/archiveStatus'

describe('archiveStatus', () => {
  it('选项覆盖全部状态且以「全部状态」开头', () => {
    expect(statusOptions[0]).toEqual({ value: '', label: '全部状态' })
    expect(statusOptions.map((o) => o.label)).toEqual([
      '全部状态',
      '草稿',
      '待审批',
      '通过',
      '已退回',
      '已撤销',
    ])
  })

  it('statusTagType 按状态映射标签色', () => {
    expect(statusTagType(2)).toBe('success')
    expect(statusTagType(3)).toBe('danger')
    expect(statusTagType(1)).toBe('warning')
    expect(statusTagType(0)).toBe('info')
    expect(statusTagType(null)).toBe('info')
  })

  it('statusLabel 未匹配时返回占位符', () => {
    expect(statusLabel(2)).toBe('通过')
    expect(statusLabel(0)).toBe('草稿')
    expect(statusLabel(null)).toBe('-')
    expect(statusLabel(99)).toBe('-')
  })
})
