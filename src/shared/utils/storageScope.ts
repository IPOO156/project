/**
 * 按登录用户隔离 localStorage 键。
 *
 * 表单草稿、已撤回标记等属于「当前登录学生」的数据。若使用全局固定键，
 * 同一浏览器换账号登录时会读到上一个账号的内容（共享电脑/浏览器场景下的隐私泄漏）。
 * 这里从登录后写入的 user_info_cache 中取用户 id 作为命名空间；
 * 未登录或缓存不可用时统一落到 anonymous，避免把不同用户的空态混在一起。
 */
const USER_CACHE_KEY = 'user_info_cache'

export function getStorageScope(): string {
  if (typeof window === 'undefined') return 'anonymous'
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return 'anonymous'
    const info = JSON.parse(raw) as { id?: string | number; studentId?: string; username?: string }
    const id = info?.id ?? info?.studentId ?? info?.username
    return id == null || String(id) === '' ? 'anonymous' : `u${id}`
  } catch {
    return 'anonymous'
  }
}

/** 给基础键追加当前用户命名空间，例如 form_draft_x → form_draft_x::u2 */
export function scopedStorageKey(baseKey: string): string {
  return `${baseKey}::${getStorageScope()}`
}

/**
 * 清除当前登录用户命名空间下的指定基础键（登出/会话失效时调用）。
 *
 * 表单草稿与撤回标记都含学生个人信息，必须随会话结束清理，否则共享浏览器中
 * 下一个使用者可通过开发者工具读到上一用户的未提交内容。
 *
 * 调用时机要求：**必须在删除 `user_info_cache` 之前**执行，否则 getStorageScope()
 * 已退化为 anonymous，找不到原用户的 `::u<id>` 键。
 * 同时清理 `::anonymous`，覆盖登录态缓存缺失期间写入的兜底数据。
 *
 * @param basePrefixes 基础键前缀（不含 `::u<id>` 后缀），如 `form_draft_`、`submission:`
 */
export function clearCurrentUserScopedStorage(basePrefixes: readonly string[]): void {
  if (typeof window === 'undefined') return
  const scopes = new Set([getStorageScope(), 'anonymous'])
  const suffixes = [...scopes].map((scope) => `::${scope}`)
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (!suffixes.some((suffix) => key.endsWith(suffix))) continue
      if (basePrefixes.some((prefix) => key.startsWith(prefix))) keys.push(key)
    }
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // 隐私模式或存储不可用时静默降级
  }
}
