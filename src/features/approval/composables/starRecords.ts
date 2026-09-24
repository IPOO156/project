/**
 * 奖项审核 - 之星报名记录的类型与筛选工具
 * 记录数据来自后端接口（见 app/stores/award-review.ts），本文件不含任何示例数据。
 */

/** 之星报名记录（含各类型特有字段） */
export interface StarRecord {
  id: string
  type: string
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  status: string
  sourcePath: string
  applicant: string
  // 竞赛之星
  competitionName?: string
  competitionDate?: string
  competitionLevel?: string
  awardLevel?: string
  // 科研项目
  projectName?: string
  projectLevel?: string
  // 软著
  softName?: string
  issuer?: string
  // 论文
  paperName?: string
  journalName?: string
  // 公共
  ranking?: string
  projectDate?: string
  approveDate?: string
  publishDate?: string
  // 双创之星
  companyName?: string
  industryType?: string
  registerDate?: string
}

export const SCIENTIFIC_SUB_TYPES = ['scientificProject', 'softwareCopyright', 'paper']

/** 按类型筛选之星报名数据 */
export function filterStarRecords(records: StarRecord[], typeKey: string): StarRecord[] {
  if (typeKey === 'all') return records
  if (typeKey === 'competitionStar') return records.filter((r) => r.type === 'competitionStar')
  if (typeKey === 'innovationStar') return records.filter((r) => r.type === 'innovationStar')
  if (typeKey === 'scientificStar')
    return records.filter((r) => SCIENTIFIC_SUB_TYPES.includes(r.type))
  return records
}

/** 判断之星报名记录是否可编辑 */
export function canEditStar(status: string): boolean {
  return status === 'submitted' || status === 'rejected'
}
