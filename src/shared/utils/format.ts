import dayjs from 'dayjs'

/**
 * 格式化日期
 */
export function formatDate(date: string | Date | undefined | null, template = 'YYYY-MM-DD'): string {
  if (!date) return '-'
  return dayjs(date).format(template)
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化金额/分数
 */
export function formatScore(score: number | undefined | null, decimals = 2): string {
  if (score === undefined || score === null) return '-'
  return Number(score).toFixed(decimals)
}

/**
 * 格式化绩点
 */
export function formatGpa(gpa: number | undefined | null): string {
  if (gpa === undefined || gpa === null) return '-'
  return Number(gpa).toFixed(2)
}

/**
 * 空值兜底
 */
export function orNa(value: any, fallback = '-'): string {
  return value ?? fallback
}
