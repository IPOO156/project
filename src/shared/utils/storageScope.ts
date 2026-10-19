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
