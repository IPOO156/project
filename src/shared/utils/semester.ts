export interface SemesterRange {
  startYear: number
  endYear: number
  term: number
}

function normalizeSemester(semester: unknown): string {
  return typeof semester === 'string' ? semester.trim() : ''
}

/**
 * 学期名称的合法书写形式。
 *
 * 后端 semesters.name 由管理员自由填写（SemesterManageService 只校验非空），
 * 线上实际值为「2025-2026-第1学期」；接口文档与旧单测只覆盖「2025-2026-1」。
 * 学生端拿到的下拉 value 就是 name 原文，因此这里必须同时兼容：
 *   2025-2026-1 / 2025-2026-第1学期 / 2025-2026第1学期 / 2025-2026-第一学期
 * 否则学期无法解析 → 所有日期都被判为“不在学期内”并被清空（2026-11-12 反馈）。
 */
const SEMESTER_PATTERN = /^(\d{4})-(\d{4})-?第?([一二12])(?:学期)?$/

const CHINESE_TERM: Record<string, number> = { 一: 1, 二: 2 }

export function parseSemesterRange(semester: unknown): SemesterRange | null {
  const normalized = normalizeSemester(semester)
  const match = normalized.match(SEMESTER_PATTERN)
  if (!match) return null

  const startYear = Number(match[1])
  const endYear = Number(match[2])
  const term = CHINESE_TERM[match[3]] ?? Number(match[3])

  if (endYear !== startYear + 1) return null
  if (term !== 1 && term !== 2) return null

  return { startYear, endYear, term }
}

export function normalizeMonthValue(value: unknown): string {
  if (!value) return ''

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const match = trimmed.match(/^(\d{4})-(\d{1,2})/)
    if (!match) return ''
    const year = match[1]
    const month = match[2].padStart(2, '0')
    return `${year}-${month}`
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  return ''
}

export function isMonthInSemester(monthValue: unknown, semester: unknown): boolean {
  const normalizedMonth = normalizeMonthValue(monthValue)
  const range = parseSemesterRange(semester)

  if (!normalizedMonth || !range) return false

  const [yearText, monthText] = normalizedMonth.split('-')
  const year = Number(yearText)
  const month = Number(monthText)

  if (Number.isNaN(year) || Number.isNaN(month)) return false

  if (range.term === 1) {
    return (
      (year === range.startYear && month >= 9 && month <= 12) ||
      (year === range.endYear && month === 1)
    )
  }

  return year === range.endYear && month >= 2 && month <= 7
}

export function buildSemesterMonthDisabledDate(semester: unknown) {
  const range = parseSemesterRange(semester)
  if (!range) {
    return () => false
  }

  return (date: Date) =>
    !isMonthInSemester(date, `${range.startYear}-${range.endYear}-${range.term}`)
}

export function sanitizeSemesterMonthPair<T extends Record<string, unknown>>(
  form: T,
  monthField: keyof T,
  semesterField: keyof T,
) {
  const monthValue = form[monthField]
  const semesterValue = form[semesterField]
  const normalizedMonth = normalizeMonthValue(monthValue)
  const hasSemester = typeof semesterValue === 'string' && semesterValue.trim() !== ''

  if (normalizedMonth && monthValue !== normalizedMonth) {
    form[monthField] = normalizedMonth as T[keyof T]
  }

  if (!normalizedMonth || !hasSemester) return

  // 只在学期**可解析**时清空日期：无法识别学期名称时（管理员自填格式）不做判断，
  // 否则会把用户已填的日期无条件抹掉，且提交永远失败。
  if (!parseSemesterRange(semesterValue)) return

  if (!isMonthInSemester(normalizedMonth, semesterValue)) {
    form[monthField] = '' as T[keyof T]
  }
}
