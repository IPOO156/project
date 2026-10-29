import { describe, expect, it } from 'vitest'
import {
  findRingBySemester,
  getSemesterDisplayLabel,
  getSemesterIndex,
  getSemesterLabel,
  inferSemester,
  mapTimelineEventType,
  SEMESTER_RINGS,
  TIMELINE_EVENT_TYPE_LABELS,
} from '@/features/growth-timeline/timelineConstants'

describe('inferSemester', () => {
  it('9 月及以后归入当年第一学期', () => {
    expect(inferSemester('2026-09-01')).toBe('2026-2027-1')
    expect(inferSemester('2026-12-31')).toBe('2026-2027-1')
  })

  it('1 月仍属上一学年第一学期', () => {
    expect(inferSemester('2027-01-15')).toBe('2026-2027-1')
  })

  it('2~8 月归入上一学年的第二学期', () => {
    expect(inferSemester('2027-03-01')).toBe('2026-2027-2')
    expect(inferSemester('2027-08-31')).toBe('2026-2027-2')
  })
})

describe('学期环形映射', () => {
  it('8 个学期编码连续且唯一', () => {
    expect(SEMESTER_RINGS).toHaveLength(8)
    expect(new Set(SEMESTER_RINGS.map((r) => r.code)).size).toBe(8)
    expect(SEMESTER_RINGS.map((r) => r.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('按学期编码查找，未命中返回 undefined', () => {
    expect(findRingBySemester('2023-2024-1')?.label).toBe('大一上')
    expect(findRingBySemester('2099-2100-1')).toBeUndefined()
  })

  it('未命中时索引为 0，展示标签回退为原值', () => {
    expect(getSemesterIndex('2023-2024-1')).toBe(1)
    expect(getSemesterIndex('2099-2100-1')).toBe(0)
    expect(getSemesterDisplayLabel('2024-2025-1')).toBe('第3学期')
    expect(getSemesterDisplayLabel('2099-2100-1')).toBe('2099-2100-1')
    expect(getSemesterLabel('2024-2025-1')).toBe('大二上')
    expect(getSemesterLabel('2099-2100-1')).toBe('2099-2100-1')
  })
})

describe('mapTimelineEventType', () => {
  it('4/5/6 单独成标签，不再折叠为「其他」', () => {
    expect(mapTimelineEventType(4)).toBe('职业规划')
    expect(mapTimelineEventType(5)).toBe('短板改进')
    expect(mapTimelineEventType(6)).toBe('能力提升')
  })

  it('未定义或缺失的类型回退为「其他」', () => {
    expect(mapTimelineEventType(9)).toBe('其他')
    expect(mapTimelineEventType(undefined)).toBe('其他')
    expect(Object.keys(TIMELINE_EVENT_TYPE_LABELS)).toHaveLength(6)
  })
})
