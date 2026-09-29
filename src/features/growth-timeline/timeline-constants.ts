export interface GrowthExperience {
  id: string
  title: string
  date: string
  semester: string
  description: string
  tags: string[]
  skills: { name: string; growth: number }[]
  /** 后端事件对应的档案记录 ID（sourceId），本地新增经历无此字段 */
  recordId?: string
  /** 审核状态文案（由后端返回，有则展示、无则不展示，不硬编码字典） */
  statusLabel?: string
}

/** 新增成长经历的提交入参（含可选来源记录：4.2.1 要求 sourceId+sourceType 来源必填才能落库） */
export interface GrowthExperienceInput {
  title: string
  date: string
  description: string
  tags: string[]
  skills: { name: string; growth: number }[]
  /** 来源记录 ID（4.2.1 sourceId，从已提交的申报/报名记录中选择） */
  sourceId?: number
  /** 来源模型类型（4.2.1 sourceType：archives 申报 / award_applications 奖项报名） */
  sourceType?: string
}

export interface SemesterRing {
  level: number
  label: string
  code: string
  color: string
}

export const SEMESTER_RINGS: SemesterRing[] = [
  { level: 1, label: '大一上', code: '2023-2024-1', color: '#5a7c5a' },
  { level: 2, label: '大一下', code: '2023-2024-2', color: '#c8943e' },
  { level: 3, label: '大二上', code: '2024-2025-1', color: '#6b8e5b' },
  { level: 4, label: '大二下', code: '2024-2025-2', color: '#a88560' },
  { level: 5, label: '大三上', code: '2025-2026-1', color: '#5a7c5a' },
  { level: 6, label: '大三下', code: '2025-2026-2', color: '#c8943e' },
  { level: 7, label: '大四上', code: '2026-2027-1', color: '#6b8e5b' },
  { level: 8, label: '大四下', code: '2026-2027-2', color: '#a88560' },
]

export function inferSemester(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const isFirstTerm = month >= 9 || month <= 1
  const startYear = isFirstTerm ? year : year - 1
  const term = isFirstTerm ? 1 : 2
  return `${startYear}-${startYear + 1}-${term}`
}

export function findRingBySemester(semester: string): SemesterRing | undefined {
  return SEMESTER_RINGS.find((r) => r.code === semester)
}

export function getSemesterIndex(semester: string): number {
  return findRingBySemester(semester)?.level ?? 0
}

export function getSemesterDisplayLabel(semester: string): string {
  const index = getSemesterIndex(semester)
  return index > 0 ? `第${index}学期` : semester
}

export function getSemesterLabel(semester: string): string {
  return findRingBySemester(semester)?.label ?? semester
}

/** 成长时间轴事件类型标签（对齐学生端接口文档 §10.7，4/5/6 不再折叠为「其他」） */
export const TIMELINE_EVENT_TYPE_LABELS: Record<number, string> = {
  1: '奖项',
  2: '成绩',
  3: '实践',
  4: '职业规划',
  5: '短板改进',
  6: '能力提升',
}

export function mapTimelineEventType(type: number | undefined): string {
  return TIMELINE_EVENT_TYPE_LABELS[type ?? 0] ?? '其他'
}
