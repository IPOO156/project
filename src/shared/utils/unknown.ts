/**
 * 后端动态 JSON 的安全取值助手。
 * 用于替代 `any`：接口响应先视为 `unknown`，在边界处收窄为记录/数组/标量，
 * 避免把未校验的响应直接当强类型对象使用。
 */

/** 收窄为普通对象；null / 数组 / 原始值返回空对象 */
export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** 收窄为数组；非数组返回空数组 */
export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/** 收窄为字符串；null/undefined 返回 fallback，其余转 String */
export function asText(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback
  return typeof value === 'string' ? value : String(value)
}

/** 收窄为有限数字；无法解析时返回 fallback */
export function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/** 可选数字：null/undefined/空串返回 undefined，其余按 asNumber 解析 */
export function asOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** 可选字符串：null/undefined/空串返回 undefined */
export function asOptionalText(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined
  return typeof value === 'string' ? value : String(value)
}

/** 后端 0/1、true/false、'1' 统一归一为布尔 */
export function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}
