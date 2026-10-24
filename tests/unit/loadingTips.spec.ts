import { describe, expect, it } from 'vitest'
import { resolveGradeStage } from '@/shared/constants/loadingTips'

describe('resolveGradeStage', () => {
  it('识别本科四个年级的中文写法', () => {
    expect(resolveGradeStage('大一')).toBe('freshman')
    expect(resolveGradeStage('大二')).toBe('sophomore')
    expect(resolveGradeStage('大三')).toBe('junior')
    expect(resolveGradeStage('大四')).toBe('senior')
  })

  it('博士优先于硕士（避免「博士研究生」被判成 master）', () => {
    expect(resolveGradeStage('博士研究生')).toBe('phd')
    expect(resolveGradeStage('博一')).toBe('phd')
    expect(resolveGradeStage('硕士研究生')).toBe('master')
    expect(resolveGradeStage('研二')).toBe('master')
  })

  it('英文写法同样可识别', () => {
    expect(resolveGradeStage('Freshman')).toBe('freshman')
    expect(resolveGradeStage('Master')).toBe('master')
    expect(resolveGradeStage('PhD')).toBe('phd')
  })

  it('只有入学年份时按本科四年制推算', () => {
    const currentYear = new Date().getFullYear()
    expect(resolveGradeStage(`${currentYear}级`)).toBe('freshman')
  })

  it('空值与无法识别的文本返回 null', () => {
    expect(resolveGradeStage('')).toBeNull()
    expect(resolveGradeStage(null)).toBeNull()
    expect(resolveGradeStage('教师')).toBeNull()
  })
})
