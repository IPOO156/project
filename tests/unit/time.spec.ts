import { describe, expect, it } from 'vitest'
import { toLocalDateString } from '@/shared/utils/time'

describe('toLocalDateString 本地日期', () => {
  it('按本地年月日补零，不受 UTC 偏移影响', () => {
    expect(toLocalDateString(new Date(2026, 0, 2, 0, 30))).toBe('2026-01-02')
    expect(toLocalDateString(new Date(2026, 10, 27, 23, 59))).toBe('2026-11-27')
  })

  it('非法日期返回空串', () => {
    expect(toLocalDateString(new Date('invalid'))).toBe('')
  })

  it('不传参时返回今天（本地时区）', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}`
    expect(toLocalDateString()).toBe(expected)
  })
})
