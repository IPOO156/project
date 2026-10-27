// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getGreetingByHour, getPeriodTheme } from '@/features/dashboard/composables/useGreeting'

/** 固定到指定本地时刻，避免用例随执行时间漂移 */
function at(hour: number) {
  vi.setSystemTime(new Date(2026, 9, 25, hour, 0, 0))
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('getGreetingByHour', () => {
  it.each<[number, string, string]>([
    [6, 'morning', '早上好'],
    [11, 'morning', '早上好'],
    [12, 'noon', '中午好'],
    [13, 'noon', '中午好'],
    [14, 'afternoon', '下午好'],
    [17, 'afternoon', '下午好'],
    [18, 'evening', '晚上好'],
    [22, 'evening', '晚上好'],
    [23, 'night', '夜深了'],
    [3, 'night', '夜深了'],
  ])('%i 点 → %s', (hour, period, prefix) => {
    at(hour)

    const info = getGreetingByHour('张三')

    expect(info.period).toBe(period)
    expect(info.prefix).toBe(prefix)
    expect(info.message).toContain('张三')
  })

  it('深夜额外提示注意休息', () => {
    at(2)

    expect(getGreetingByHour('张三').message).toBe('夜深了，张三，注意休息')
  })
})

describe('getPeriodTheme', () => {
  it('各时段统一使用品牌深蓝，不按色相区分', () => {
    const gradients = (['morning', 'noon', 'afternoon', 'evening', 'night'] as const).map(
      (period) => getPeriodTheme(period).gradient,
    )

    expect(new Set(gradients).size).toBe(1)
  })
})
