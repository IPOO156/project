export interface GrowthExperience {
  id: string
  title: string
  date: string
  semester: string
  description: string
  tags: string[]
  /** 能力成长项；dimensionCode 用于写接口 abilityData（后端要求维度编码，不能只传名称） */
  skills: { name: string; growth: number; dimensionCode?: string }[]
  /** 后端事件对应的档案记录 ID（sourceId），本地新增经历无此字段 */
  recordId?: string
  /** 审核状态文案（由后端返回，有则展示、无则不展示，不硬编码字典） */
  statusLabel?: string
}

/** 新增成长经历的提交入参（后端要求必须关联已有来源记录：sourceId + sourceType 同时提供） */
export interface GrowthExperienceInput {
  title: string
  date: string
  description: string
  tags: string[]
  skills: { name: string; growth: number; dimensionCode?: string }[]
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

/** 本科四年共 8 个学期；年轮圈数与学期一一对应 */
export const SEMESTER_RING_COUNT = 8

const RING_LABELS = ['大一上', '大一下', '大二上', '大二下', '大三上', '大三下', '大四上', '大四下']

/** 年轮配色（与既有视觉保持一致，后续可整体替换为品牌色带） */
const RING_COLORS = ['#5a7c5a', '#c8943e', '#6b8e5b', '#a88560']

/**
 * 按入学年份生成 8 个学期的年轮定义。
 * 学期编码规则：`入学年-入学年+1-学期`，不能写死某一届，
 * 否则其他年级的学生会被显示成错误的「大四上 / 第 7 学期」。
 */
export function buildSemesterRings(cohortYear: number): SemesterRing[] {
  return RING_LABELS.map((label, index) => {
    const startYear = cohortYear + Math.floor(index / 2)
    const term = (index % 2) + 1
    return {
      level: index + 1,
      label,
      code: `${startYear}-${startYear + 1}-${term}`,
      color: RING_COLORS[index % RING_COLORS.length]!,
    }
  })
}

/** 学年起始年：9 月及以后算当年，1~8 月算上一年 */
export function getAcademicStartYear(date = new Date()): number {
  return date.getMonth() + 1 >= 9 ? date.getFullYear() : date.getFullYear() - 1
}

const STAGE_PATTERNS: [RegExp, number][] = [
  [/大一|一年级|freshman/i, 1],
  [/大二|二年级|sophomore/i, 2],
  [/大三|三年级|junior/i, 3],
  [/大四|四年级|senior/i, 4],
]

/**
 * 推导学生入学年份（年轮起点）。
 * 优先级：年级中的 4 位年份（如「2024级」）→ 年级文字（如「大二」）→ 学号前 4 位 → 当年入学。
 * 学号仅在形如 20xx 且不晚于当前学年时采用，避免把非年份前缀误当入学年。
 */
export function resolveCohortYear(
  grade?: string | null,
  studentId?: string | null,
  now = new Date(),
): number {
  const academicStart = getAcademicStartYear(now)
  const gradeText = (grade ?? '').trim()

  const explicitYear = gradeText.match(/20\d{2}/)
  if (explicitYear) return Number(explicitYear[0])

  for (const [pattern, stage] of STAGE_PATTERNS) {
    if (pattern.test(gradeText)) return academicStart - (stage - 1)
  }

  const idYear = (studentId ?? '').trim().match(/^(20\d{2})/)
  if (idYear) {
    const year = Number(idYear[1])
    if (year >= 2000 && year <= academicStart) return year
  }

  // 兜底：按当年入学处理，保证年轮与年级文案至少自洽
  return academicStart
}

/**
 * 按学期编码查找对应年轮。
 * cohortYear 必须显式传入（由 useSemesterRings 从当前学生年级推导），
 * 同一学期编码对不同届学生对应不同年级，不能靠固定表查找。
 */
export function findRingBySemester(semester: string, cohortYear: number): SemesterRing | undefined {
  const matched = /^(\d{4})-\d{4}-([12])$/.exec(semester)
  if (!matched) return undefined

  const startYear = Number(matched[1])
  const term = Number(matched[2])
  const level = (startYear - cohortYear) * 2 + term
  if (level < 1 || level > SEMESTER_RING_COUNT) return undefined

  return buildSemesterRings(cohortYear)[level - 1]
}

export function getSemesterIndex(semester: string, cohortYear: number): number {
  return findRingBySemester(semester, cohortYear)?.level ?? 0
}

export function getSemesterDisplayLabel(semester: string, cohortYear: number): string {
  const index = getSemesterIndex(semester, cohortYear)
  return index > 0 ? `第${index}学期` : semester
}

export function getSemesterLabel(semester: string, cohortYear: number): string {
  return findRingBySemester(semester, cohortYear)?.label ?? semester
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
