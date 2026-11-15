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

/** 规范化 yyyy-MM-dd 为 yyyy-MM（仅保留到月份，供月份粒度比较使用） */
function monthOfDateText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 7) : ''
}

/**
 * 月份值是否晚于给定日期所在月份。
 * 用于「立项时间不能晚于学期结束日期」这类只设上界的校验：endDate 缺失时恒为 false（不拦截）。
 */
export function isMonthAfterDate(value: unknown, endDate: unknown): boolean {
  const month = normalizeMonthValue(value)
  const endMonth = monthOfDateText(endDate)
  if (!month || !/^\d{4}-\d{2}$/.test(endMonth)) return false
  return month > endMonth
}

/**
 * 只限制上界的日期选择器禁用逻辑：晚于 endDate 所在月份不可选。
 * endDate 缺失时全部可选，避免老后端未返回该字段时把日期选择器整片禁用。
 */
export function buildSemesterEndMonthDisabledDate(endDate: unknown) {
  const endMonth = monthOfDateText(endDate)
  if (!/^\d{4}-\d{2}$/.test(endMonth)) return () => false
  return (date: Date) => normalizeMonthValue(date) > endMonth
}

export function sanitizeSemesterMonthPair<T extends Record<string, unknown>>(
  form: T,
  monthField: keyof T,
  semesterField: keyof T,
  endDate?: string,
) {
  const monthValue = form[monthField]
  const semesterValue = form[semesterField]
  const normalizedMonth = normalizeMonthValue(monthValue)
  const hasSemester = typeof semesterValue === 'string' && semesterValue.trim() !== ''

  if (normalizedMonth && monthValue !== normalizedMonth) {
    form[monthField] = normalizedMonth as T[keyof T]
  }

  if (!normalizedMonth || !hasSemester) return

  // 只设上界的模式（传了学期 endDate）：仅清空晚于学期结束的月份，
  // 允许早于学期开始的日期（如学期开始前就已立项的科研项目）。
  if (endDate) {
    if (isMonthAfterDate(normalizedMonth, endDate)) {
      form[monthField] = '' as T[keyof T]
    }
    return
  }

  // 只在学期**可解析**时清空日期：无法识别学期名称时（管理员自填格式）不做判断，
  // 否则会把用户已填的日期无条件抹掉，且提交永远失败。
  if (!parseSemesterRange(semesterValue)) return

  if (!isMonthInSemester(normalizedMonth, semesterValue)) {
    form[monthField] = '' as T[keyof T]
  }
}
