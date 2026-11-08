import { describe, expect, it } from 'vitest'
import * as dict from '@/shared/constants/dict'

interface Option {
  label?: unknown
  value?: unknown
  color?: unknown
}

/** 把字典导出统一摊平成选项数组；非字典导出（函数等）返回 null 跳过 */
function toOptions(value: unknown): Option[] | null {
  if (Array.isArray(value)) {
    // 纯字符串数组（如 SUGGESTION_TYPE_OPTIONS）按「文案即取值」处理
    return value.map((item) => (typeof item === 'string' ? { label: item, value: item } : item))
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    // 只认「字典」形态：值必须是文案字符串，或至少带 label 的对象；
    // status → number 这类映射表不是选项字典，跳过。
    const isDictionary = entries.every(
      ([, item]) =>
        typeof item === 'string' ||
        (item != null && typeof item === 'object' && 'label' in (item as object)),
    )
    if (!isDictionary) return null
    return entries.map(([key, item]) =>
      typeof item === 'string' ? { value: key, label: item } : { value: key, ...(item as object) },
    )
  }
  return null
}

const dictionaryEntries = Object.entries(dict).filter(([, value]) => toOptions(value) !== null)

describe('字典集中维护', () => {
  it('至少包含全部业务字典导出（防止误删）', () => {
    expect(dictionaryEntries.length).toBeGreaterThanOrEqual(15)
  })

  it.each(dictionaryEntries)('%s 的每个选项都有非空文案', (_name, value) => {
    const options = toOptions(value) as Option[]
    expect(options.length).toBeGreaterThan(0)
    for (const option of options) {
      expect(typeof option.label).toBe('string')
      expect(String(option.label).trim()).not.toBe('')
      expect(option.value).not.toBeUndefined()
    }
  })

  it.each(dictionaryEntries)('%s 的取值不重复', (_name, value) => {
    const options = toOptions(value) as Option[]
    const values = options.map((option) => String(option.value))
    expect(new Set(values).size).toBe(values.length)
  })

  it('状态类字典带颜色，便于表格统一渲染', () => {
    const colored = ['APPLICATION_STATUS', 'NOTIFICATION_STATUS', 'ACTIVITY_STATUS'] as const
    for (const name of colored) {
      const options = toOptions((dict as Record<string, unknown>)[name]) as Option[]
      expect(options.every((option) => typeof option.color === 'string')).toBe(true)
    }
  })

  // 学期选项已改由 useSemesters 从后端获取，dict 不再内置学期列表。
})

describe('业务字典与后端 dictionaries 表对齐', () => {
  function valuesOf(options: readonly { value: string }[]): string[] {
    return options.map((option) => option.value)
  }

  it('竞赛类型使用 competition_type，竞赛级别单独使用 competition_level', () => {
    expect(valuesOf(dict.COMPETITION_TYPES)).toEqual([
      'academic',
      'technology',
      'innovation',
      'art',
      'sports',
      'other',
    ])
    expect(valuesOf(dict.COMPETITION_LEVELS)).toEqual([
      'national',
      'provincial',
      'school',
      'college',
    ])
  })

  it('获奖等级、项目级别、研究类型与后端 seed 一致', () => {
    expect(valuesOf(dict.AWARD_LEVELS)).toEqual([
      'special',
      'first',
      'second',
      'third',
      'excellence',
    ])
    expect(valuesOf(dict.PROJECT_LEVELS)).toEqual(['national', 'provincial', 'school', 'college'])
    expect(valuesOf(dict.RESEARCH_TYPES)).toEqual(['basic', 'applied', 'experimental', 'other'])
  })

  it('组织级别、行业类型、企业类型、奖学金字典与后端 seed 一致', () => {
    expect(valuesOf(dict.ORGANIZATION_LEVELS)).toEqual(['school', 'college', 'department', 'other'])
    expect(valuesOf(dict.INDUSTRY_TYPES)).toHaveLength(11)
    expect(valuesOf(dict.INDUSTRY_TYPES)).toContain('internet')
    expect(valuesOf(dict.INNOVATION_COMPANY_TYPES)).toContain('limited_liability')
    expect(valuesOf(dict.SCHOLARSHIP_LEVELS)).toEqual([
      'national',
      'provincial',
      'school',
      'enterprise',
    ])
    expect(valuesOf(dict.SCHOLARSHIP_GRADES)).toEqual(['special', 'first', 'second', 'third'])
  })

  it('canonical 下拉不包含只用于旧数据展示的码', () => {
    expect(valuesOf(dict.COMPETITION_TYPES)).not.toContain('national')
    expect(valuesOf(dict.RESEARCH_TYPES)).not.toContain('development')
    expect(valuesOf(dict.ORGANIZATION_LEVELS)).not.toContain('club')
    expect(valuesOf(dict.ORGANIZATION_LEVELS)).not.toContain('class')
    expect(valuesOf(dict.INDUSTRY_TYPES)).not.toContain('it')
    expect(valuesOf(dict.INDUSTRY_TYPES)).not.toContain('media')
    expect(valuesOf(dict.INDUSTRY_TYPES)).not.toContain('business')
    expect(valuesOf(dict.SCHOLARSHIP_LEVELS)).not.toContain('college')
    expect(valuesOf(dict.INNOVATION_COMPANY_TYPES)).not.toContain('创业实践')
  })

  it('旧数据展示数组补充 legacy 码且不与 canonical 重复', () => {
    expect(valuesOf(dict.COMPETITION_TYPE_DISPLAY_OPTIONS)).toContain('national')
    expect(valuesOf(dict.RESEARCH_TYPE_DISPLAY_OPTIONS)).toContain('development')
    expect(valuesOf(dict.ORGANIZATION_LEVEL_DISPLAY_OPTIONS)).toContain('club')
    expect(valuesOf(dict.INDUSTRY_TYPE_DISPLAY_OPTIONS)).toContain('it')
    expect(valuesOf(dict.SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS)).toContain('college')
    expect(valuesOf(dict.COMPANY_TYPE_DISPLAY_OPTIONS)).toContain('创业实践')

    for (const options of [
      dict.COMPETITION_TYPE_DISPLAY_OPTIONS,
      dict.RESEARCH_TYPE_DISPLAY_OPTIONS,
      dict.ORGANIZATION_LEVEL_DISPLAY_OPTIONS,
      dict.INDUSTRY_TYPE_DISPLAY_OPTIONS,
      dict.SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS,
      dict.COMPANY_TYPE_DISPLAY_OPTIONS,
    ]) {
      const values = valuesOf(options)
      expect(new Set(values).size).toBe(values.length)
    }
  })
})
