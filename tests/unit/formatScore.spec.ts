import { describe, expect, it } from 'vitest'
import { calcAggregateScore } from '@/shared/utils/score'
import { formatDateOnly, formatDateTime, toDayRangeBounds } from '@/shared/utils/time'
import { validatePasswordStrength } from '@/shared/utils/validatePassword'

describe('calcAggregateScore', () => {
  it('按 Σ得分 / Σ满分 折算百分制', () => {
    expect(
      calcAggregateScore([
        { score: 20, maxScore: 50 },
        { score: 10, maxScore: 30 },
        { score: 0, maxScore: 20 },
      ]),
    ).toBe(30)
  })

  it('忽略满分为 0 的维度，避免结果虚高', () => {
    expect(
      calcAggregateScore([
        { score: 10, maxScore: 20 },
        { score: 999, maxScore: 0 },
      ]),
    ).toBe(50)
  })

  it('没有有效维度时返回 null（表示无法计算，而非 0 分）', () => {
    expect(calcAggregateScore([])).toBeNull()
    expect(calcAggregateScore([{ score: 0, maxScore: 0 }])).toBeNull()
  })
})

describe('formatDateTime / formatDateOnly', () => {
  it('把 ISO 时间转换为易读格式', () => {
    expect(formatDateTime('2026-09-06T14:30:00+08:00')).toBe('2026-09-06 14:30')
    expect(formatDateTime('2026-09-06T14:30:45+08:00', true)).toBe('2026-09-06 14:30:45')
    expect(formatDateTime('2026-09-06 14:30:00')).toBe('2026-09-06 14:30')
  })

  it('空值统一返回占位符', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(undefined)).toBe('-')
    expect(formatDateOnly('')).toBe('-')
    expect(formatDateOnly('2026-09-06T14:30:00')).toBe('2026-09-06')
  })
})

describe('toDayRangeBounds', () => {
  it('结束日补到 23:59:59，避免漏掉当天记录', () => {
    expect(toDayRangeBounds(['2026-10-01', '2026-10-19'])).toEqual({
      startTime: '2026-10-01T00:00:00',
      endTime: '2026-10-19T23:59:59',
    })
  })

  it('区间不完整时返回空对象', () => {
    expect(toDayRangeBounds(null)).toEqual({})
    expect(toDayRangeBounds([])).toEqual({})
    expect(toDayRangeBounds(['2026-10-01'])).toEqual({})
    expect(toDayRangeBounds(['', '2026-10-19'])).toEqual({})
  })
})

describe('validatePasswordStrength', () => {
  it('长度不在 6-32 位时报错', () => {
    expect(validatePasswordStrength('aA1!').message).toBe('密码长度需为 6-32 位')
    expect(validatePasswordStrength(`aA1!${'x'.repeat(30)}`).message).toBe('密码长度需为 6-32 位')
  })

  it('缺少各类字符时给出对应提示', () => {
    expect(validatePasswordStrength('aa11!!').message).toBe('密码需包含大写字母')
    expect(validatePasswordStrength('AA11!!').message).toBe('密码需包含小写字母')
    expect(validatePasswordStrength('AAaa!!').message).toBe('密码需包含数字')
    expect(validatePasswordStrength('AAaa11').message).toBe('密码需包含特殊字符（如 !@#）')
  })

  it('四类字符齐全且长度合法时通过', () => {
    expect(validatePasswordStrength('Aa123456!')).toEqual({ valid: true, message: '' })
  })
})
