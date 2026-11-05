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

  it('学期选项按学年升序生成且不重复', () => {
    const values = dict.SEMESTER_OPTIONS.map((item) => String(item.value))
    expect(new Set(values).size).toBe(values.length)
    const years = values.map((value) => Number(value.slice(0, 4)))
    expect(years[0]).toBeLessThanOrEqual(years[years.length - 1])
  })
})
