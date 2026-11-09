import { describe, expect, it } from 'vitest'
import { activityCategoryOf, sourcePathOf } from '@/shared/api/submission/record-utils'

describe('sourcePathOf', () => {
  it('职业规划跳到成长发展页，并携带 planId 直接打开详情', () => {
    expect(sourcePathOf('career_plan')).toBe('/profile/career-plan')
    expect(sourcePathOf('career_plan', '42')).toBe('/profile/career-plan?planId=42')
  })

  it('申报类型保持原有 tab 路由', () => {
    expect(sourcePathOf('competition')).toBe('/applications?tab=competition')
    expect(sourcePathOf('socialPractice')).toBe('/applications?tab=social-practice')
    expect(sourcePathOf('competitionStar')).toBe('/awards/competition-star')
    expect(sourcePathOf('paper')).toBe('/awards/scientific-star?sub=paper')
  })
})

describe('activityCategoryOf', () => {
  it('职业规划归 career_plan，不能落到 archive（id 与档案表独立）', () => {
    expect(activityCategoryOf('career_plan')).toBe('career_plan')
    expect(activityCategoryOf('competition')).toBe('archive')
    expect(activityCategoryOf('competitionStar')).toBe('award')
  })
})
