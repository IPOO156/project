import { describe, expect, it } from 'vitest'
import {
  buildSemesterMonthDisabledDate,
  isMonthInSemester,
  normalizeMonthValue,
  parseSemesterRange,
  sanitizeSemesterMonthPair,
} from '@/shared/utils/semester'

describe('parseSemesterRange', () => {
  it('解析合法学期', () => {
    expect(parseSemesterRange('2026-2027-1')).toEqual({ startYear: 2026, endYear: 2027, term: 1 })
    expect(parseSemesterRange(' 2026-2027-2 ')).toEqual({ startYear: 2026, endYear: 2027, term: 2 })
  })

  it('兼容后端管理员自填的中文学期名（线上实际值）', () => {
    // 线上 semesters.name 实际为「2025-2026-第1学期」，接口下拉 value 即该原文
    expect(parseSemesterRange('2025-2026-第1学期')).toEqual({
      startYear: 2025,
      endYear: 2026,
      term: 1,
    })
    expect(parseSemesterRange('2025-2026第2学期')).toEqual({
      startYear: 2025,
      endYear: 2026,
      term: 2,
    })
    expect(parseSemesterRange('2025-2026-第一学期')).toEqual({
      startYear: 2025,
      endYear: 2026,
      term: 1,
    })
    expect(parseSemesterRange('2025-2026-第二学期')).toEqual({
      startYear: 2025,
      endYear: 2026,
      term: 2,
    })
  })

  it('拒绝非法格式、跨年不连续与非法学期', () => {
    expect(parseSemesterRange('2026-2028-1')).toBeNull()
    expect(parseSemesterRange('2026-2027-3')).toBeNull()
    expect(parseSemesterRange('2026/2027/1')).toBeNull()
    expect(parseSemesterRange(null)).toBeNull()
    expect(parseSemesterRange(2026)).toBeNull()
  })
})

describe('normalizeMonthValue', () => {
  it('统一为 YYYY-MM', () => {
    expect(normalizeMonthValue('2026-9')).toBe('2026-09')
    expect(normalizeMonthValue('2026-09-15')).toBe('2026-09')
    expect(normalizeMonthValue(' 2026-12 ')).toBe('2026-12')
  })

  it('支持 Date 与空值', () => {
    expect(normalizeMonthValue(new Date(2026, 0, 15))).toBe('2026-01')
    expect(normalizeMonthValue('')).toBe('')
    expect(normalizeMonthValue('abc')).toBe('')
    expect(normalizeMonthValue(new Date('invalid'))).toBe('')
  })
})

describe('isMonthInSemester', () => {
  it('第一学期覆盖 9-12 月与次年 1 月', () => {
    expect(isMonthInSemester('2026-09', '2026-2027-1')).toBe(true)
    expect(isMonthInSemester('2026-12', '2026-2027-1')).toBe(true)
    expect(isMonthInSemester('2027-01', '2026-2027-1')).toBe(true)
    expect(isMonthInSemester('2027-02', '2026-2027-1')).toBe(false)
    expect(isMonthInSemester('2026-08', '2026-2027-1')).toBe(false)
  })

  it('第二学期覆盖次年 2-7 月', () => {
    expect(isMonthInSemester('2027-02', '2026-2027-2')).toBe(true)
    expect(isMonthInSemester('2027-07', '2026-2027-2')).toBe(true)
    expect(isMonthInSemester('2026-09', '2026-2027-2')).toBe(false)
  })

  it('中文学期名下同样按学期范围判定', () => {
    expect(isMonthInSemester('2025-09', '2025-2026-第1学期')).toBe(true)
    expect(isMonthInSemester('2026-01', '2025-2026-第1学期')).toBe(true)
    expect(isMonthInSemester('2026-05', '2025-2026-第1学期')).toBe(false)
  })

  it('参数缺失时返回 false', () => {
    expect(isMonthInSemester('', '2026-2027-1')).toBe(false)
    expect(isMonthInSemester('2026-09', '')).toBe(false)
  })
})

describe('buildSemesterMonthDisabledDate', () => {
  it('学期非法时不禁用任何日期', () => {
    expect(buildSemesterMonthDisabledDate('')(new Date())).toBe(false)
  })

  it('按学期范围禁用', () => {
    const disabled = buildSemesterMonthDisabledDate('2026-2027-1')
    expect(disabled(new Date(2026, 9, 1))).toBe(false)
    expect(disabled(new Date(2027, 5, 1))).toBe(true)
  })
})

describe('sanitizeSemesterMonthPair', () => {
  it('把月份归一化写回表单', () => {
    const form = { month: '2026-9', semester: '2026-2027-1' }
    sanitizeSemesterMonthPair(form, 'month', 'semester')
    expect(form.month).toBe('2026-09')
  })

  it('月份不在学期内时清空', () => {
    const form = { month: '2027-05', semester: '2026-2027-1' }
    sanitizeSemesterMonthPair(form, 'month', 'semester')
    expect(form.month).toBe('')
  })

  it('无学期或月份缺失时保持原样', () => {
    const noSemester = { month: '2026-09', semester: '' }
    sanitizeSemesterMonthPair(noSemester, 'month', 'semester')
    expect(noSemester.month).toBe('2026-09')

    const empty = { month: '', semester: '2026-2027-1' }
    sanitizeSemesterMonthPair(empty, 'month', 'semester')
    expect(empty.month).toBe('')
  })

  it('学期名称无法解析时不得清空日期', () => {
    // 管理员自填了非标准学期名：前端无法判断是否匹配，保持用户输入，不误删
    const form = { month: '2026-09', semester: '2026-2027学年' }
    sanitizeSemesterMonthPair(form, 'month', 'semester')
    expect(form.month).toBe('2026-09')
  })

  it('中文学期名下按范围清理越界月份', () => {
    const form = { month: '2026-05', semester: '2025-2026-第1学期' }
    sanitizeSemesterMonthPair(form, 'month', 'semester')
    expect(form.month).toBe('')
  })
})
