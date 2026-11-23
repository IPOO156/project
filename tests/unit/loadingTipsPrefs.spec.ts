// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { pickLoadingTip, resolveLoadingTipCategories } from '@/shared/constants/loadingTips'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('pickLoadingTip 选池', () => {
  it('无匹配主题时回落到平台使用', () => {
    const picked = pickLoadingTip([])
    expect(picked.category).toBe('platform')
  })

  it('默认排除上一次展示的 id，避免连续重复', () => {
    const picked = pickLoadingTip(['platform'], { excludeId: 'platform-01' })
    expect(picked.id).not.toBe('platform-01')
  })

  it('池中仅剩一条时允许重复（不返回空）', () => {
    const only = pickLoadingTip(['platform'], { excludeId: 'whatever' })
    expect(only).toBeTruthy()
  })

  it('研究生阶段过滤掉本科专属主题', () => {
    for (let i = 0; i < 5; i++) {
      const picked = pickLoadingTip(['college', 'postgrad', 'growth'], { stage: 'master' })
      expect(['college', 'postgrad']).not.toContain(picked.category)
    }
  })

  it('有年级时只取通用建议与匹配年级的专属建议', () => {
    for (let i = 0; i < 5; i++) {
      const picked = pickLoadingTip(['growth'], { stage: 'senior' })
      if (picked.stages?.length) expect(picked.stages).toContain('senior')
    }
  })
})

describe('resolveLoadingTipCategories 场景匹配', () => {
  it('教师端与各学生路径返回对应主题', () => {
    expect(resolveLoadingTipCategories('/teacher/dashboard', true)).toEqual([
      'teaching',
      'college',
      'growth',
    ])
    expect(resolveLoadingTipCategories('/applications', false)).toContain('paper')
    expect(resolveLoadingTipCategories('/profile/career-plan', false)).toContain('postgrad')
    expect(resolveLoadingTipCategories('/ai-chat', false)).toContain('paper')
    expect(resolveLoadingTipCategories('/unknown', false)).toEqual([
      'platform',
      'growth',
      'college',
    ])
  })
})
