// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  getFavoriteTipIds,
  getFavoriteTips,
  getHiddenTipCategories,
  hideTipCategory,
  isTipFavorited,
  LOADING_TIP_CATEGORY_LABELS,
  pickLoadingTip,
  resolveLoadingTipCategories,
  restoreTipCategory,
  toggleFavoriteTip,
} from '@/shared/constants/loadingTips'

const ALL_CATEGORIES = Object.keys(LOADING_TIP_CATEGORY_LABELS) as Array<
  keyof typeof LOADING_TIP_CATEGORY_LABELS
>

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('提示主题屏蔽', () => {
  it('屏蔽后可读出，恢复后消失', () => {
    expect(hideTipCategory('college')).toBe(true)
    expect(getHiddenTipCategories()).toContain('college')

    restoreTipCategory('college')
    expect(getHiddenTipCategories()).not.toContain('college')
  })

  it('重复屏蔽幂等', () => {
    hideTipCategory('college')
    hideTipCategory('college')
    expect(getHiddenTipCategories().filter((c) => c === 'college')).toHaveLength(1)
  })

  it('不允许把全部主题屏蔽（至少保留一类）', () => {
    ALL_CATEGORIES.forEach((category) => hideTipCategory(category))
    expect(getHiddenTipCategories().length).toBe(ALL_CATEGORIES.length - 1)
  })

  it('脏数据被过滤，不产生非法分类', () => {
    localStorage.setItem('loading_tip:hidden_categories', JSON.stringify(['college', 'not-exist']))
    expect(getHiddenTipCategories()).toEqual(['college'])
  })
})

describe('提示收藏', () => {
  it('收藏与取消收藏返回状态并持久化', () => {
    expect(isTipFavorited('tip-1')).toBe(false)
    expect(toggleFavoriteTip('tip-1')).toBe(true)
    expect(isTipFavorited('tip-1')).toBe(true)
    expect(getFavoriteTipIds()).toEqual(['tip-1'])

    expect(toggleFavoriteTip('tip-1')).toBe(false)
    expect(getFavoriteTipIds()).toEqual([])
  })

  it('已下线的收藏 id 不返回文案', () => {
    toggleFavoriteTip('legacy-tip-not-exist')
    expect(getFavoriteTips()).toEqual([])
  })
})

describe('pickLoadingTip 选池', () => {
  it('排除 hidden 主题', () => {
    hideTipCategory('college')
    const picked = pickLoadingTip(['college', 'growth'])
    expect(picked.category).not.toBe('college')
  })

  it('全部主题被屏蔽时回落到平台使用', () => {
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
