import {
  DRAFT_PREFIX,
  LOADING_TIP_FAVORITES_KEY,
  LOADING_TIP_HIDDEN_KEY,
  SUBMISSION_WITHDRAWN_KEY,
  TEACHER_ME_KEY,
  USER_AVATAR_CACHE_KEY,
  USER_INFO_CACHE_KEY,
} from '@/shared/constants/storageKeys'

/**
 * 需清除的用户级存储键（固定 key；草稿键为动态拼接，另按前缀遍历）
 */
const USER_SCOPED_KEYS = [
  USER_INFO_CACHE_KEY,
  USER_AVATAR_CACHE_KEY,
  TEACHER_ME_KEY,
  SUBMISSION_WITHDRAWN_KEY,
  LOADING_TIP_FAVORITES_KEY,
  LOADING_TIP_HIDDEN_KEY,
]

/**
 * 清除用户级 / 账号级本地存储。
 *
 * 公用电脑场景：登录、登出（含 401 强制登出）后不得留下上一账号的身份缓存与表单草稿。
 * 设备级偏好（主题、AI 悬浮球位置、快捷入口等）不在清理范围。
 *
 * 注意：本函数只处理 localStorage，不涉及各 Pinia store 的内存态
 * （shared 层按分层红线不得 import app 层 store；forceLogout 会整页 reload，内存态自然消失）。
 */
export function clearUserScopedStorage(): void {
  if (typeof window === 'undefined') return
  try {
    for (const key of USER_SCOPED_KEYS) {
      localStorage.removeItem(key)
    }
    // 草稿键为 `form_draft_<页面key>` 动态拼接，无法枚举常量，按前缀遍历删除。
    // 先收集再删除：边遍历边删会打乱 localStorage 索引，导致漏删。
    const draftKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(DRAFT_PREFIX)) draftKeys.push(key)
    }
    draftKeys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级
  }
}
