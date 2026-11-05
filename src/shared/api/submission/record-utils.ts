import type { ActivityType } from '../activities'
import type { ApplicationType } from '@/shared/types/types'

/** 从表单数据推导申报标题（各类型主名称字段），无匹配时返回空串 */
export function deriveRecordTitle(data: Record<string, any>): string {
  return (
    data.competitionName ||
    data.projectName ||
    data.activityName ||
    data.bookName ||
    data.awardName ||
    data.certName ||
    data.companyName ||
    data.company || // 实习经历（表单字段为 company）
    data.softName || // 科研之星-软著
    data.paperName || // 科研之星-论文
    data.department ||
    data.title ||
    ''
  )
}

/** 奖项之星类申报类型（在 /activities 中归类为 award 分类） */
export const STAR_TYPES: ApplicationType[] = [
  'competitionStar',
  'innovationStar',
  'scientificProject',
  'softwareCopyright',
  'paper',
]

/**
 * 申报/报名类型 → /activities 的活动分类。
 * 撤回接口 PUT /activities/{id}/withdraw 需携带 type 参数。
 */
export function activityCategoryOf(applicationType: ApplicationType): ActivityType {
  return STAR_TYPES.includes(applicationType) ? 'award' : 'archive'
}

/**
 * 申报/报名类型 → 来源页路由。
 * archive 走 /applications?tab=，award 走 /awards/*；
 * 传 editId 时携带编辑参数（?edit=<id>），目标页 useApplicationPage 读到后自动进入该记录的编辑态
 *（消息中心「编辑」按钮跳转用，见 2026-08-31 修改记录）。
 */
export function sourcePathOf(type: ApplicationType, editId?: string): string {
  const STAR_ROUTES: Record<string, string> = {
    competitionStar: '/awards/competition-star',
    innovationStar: '/awards/innovation-star',
    scientificProject: '/awards/scientific-star',
    softwareCopyright: '/awards/scientific-star',
    paper: '/awards/scientific-star',
  }
  // 科研之星为「项目/软著/论文」三子 tab 共用 /awards/scientific-star，携带 sub 定位到对应子页签
  const SCIENTIFIC_SUB_TABS: Record<string, string> = {
    scientificProject: 'project',
    softwareCopyright: 'copyright',
    paper: 'paper',
  }
  const star = STAR_ROUTES[type]
  if (star) {
    const params: string[] = []
    const sub = SCIENTIFIC_SUB_TABS[type]
    if (sub) params.push(`sub=${sub}`)
    if (editId) params.push(`edit=${editId}`)
    return params.length > 0 ? `${star}?${params.join('&')}` : star
  }
  // /applications 的 tab key 为 kebab-case，与 ApplicationType 驼峰不一致的单独映射
  const tabKey =
    type === 'socialPractice' ? 'social-practice' : type === 'bookReport' ? 'book-report' : type
  const base = `/applications?tab=${tabKey}`
  return editId ? `${base}&edit=${editId}` : base
}
