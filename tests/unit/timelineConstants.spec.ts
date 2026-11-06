import { describe, expect, it } from 'vitest'
import {
  buildSemesterRings,
  findRingBySemester,
  getSemesterDisplayLabel,
  getSemesterIndex,
  getSemesterLabel,
  mapTimelineEventType,
  resolveCohortYear,
  TIMELINE_EVENT_TYPE_LABELS,
} from '@/features/growth-timeline/timelineConstants'

describe('学期环形映射', () => {
  it('按入学年份生成 8 个连续且唯一的学期编码', () => {
    const rings = buildSemesterRings(2023)
    expect(rings).toHaveLength(8)
    expect(new Set(rings.map((r) => r.code)).size).toBe(8)
    expect(rings.map((r) => r.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(rings[0]?.code).toBe('2023-2024-1')
    expect(rings[7]?.code).toBe('2026-2027-2')
  })

  it('同一学期编码按不同入学年份映射到不同年级', () => {
    expect(findRingBySemester('2026-2027-1', 2026)?.label).toBe('大一上')
    expect(findRingBySemester('2026-2027-1', 2023)?.label).toBe('大四上')
    expect(findRingBySemester('2023-2024-1', 2023)?.label).toBe('大一上')
    expect(findRingBySemester('2099-2100-1', 2023)).toBeUndefined()
  })

  it('未命中时索引为 0，展示标签回退为原值', () => {
    expect(getSemesterIndex('2023-2024-1', 2023)).toBe(1)
    expect(getSemesterIndex('2099-2100-1', 2023)).toBe(0)
    expect(getSemesterDisplayLabel('2024-2025-1', 2023)).toBe('第3学期')
    expect(getSemesterDisplayLabel('2099-2100-1', 2023)).toBe('2099-2100-1')
    expect(getSemesterLabel('2024-2025-1', 2023)).toBe('大二上')
    expect(getSemesterLabel('2099-2100-1', 2023)).toBe('2099-2100-1')
  })
})

describe('resolveCohortYear', () => {
  const now = new Date('2026-11-06T00:00:00')

  it('优先读取年级中的入学年份', () => {
    expect(resolveCohortYear('2024级', '', now)).toBe(2024)
    expect(resolveCohortYear('2023', '', now)).toBe(2023)
  })

  it('只有年级文字时按当前学年推算', () => {
    expect(resolveCohortYear('大一', '', now)).toBe(2026)
    expect(resolveCohortYear('大二', '', now)).toBe(2025)
    expect(resolveCohortYear('大四', '', now)).toBe(2023)
  })

  it('年级不可用时回退到学号前四位', () => {
    expect(resolveCohortYear('', '2022111111', now)).toBe(2022)
    expect(resolveCohortYear('', '12345678', now)).toBe(2026)
  })

  it('全部缺失时按当年入学兜底', () => {
    expect(resolveCohortYear('', '', now)).toBe(2026)
    expect(resolveCohortYear('', '', new Date('2026-03-01T00:00:00'))).toBe(2025)
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
