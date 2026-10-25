import {
  LOADING_TIP_FAVORITES_KEY,
  LOADING_TIP_HIDDEN_KEY,
  TEACHER_ME_KEY,
  USER_AVATAR_CACHE_KEY,
  USER_INFO_CACHE_KEY,
  USER_SCOPED_PREFIXES,
} from '@/shared/constants/storageKeys'
import { clearCurrentUserScopedStorage } from './storageScope'

/**
 * 需清除的用户级存储键（固定 key；草稿键为动态拼接，下按前缀清理）
 */
const USER_SCOPED_KEYS = [
  USER_INFO_CACHE_KEY,
  USER_AVATAR_CACHE_KEY,
  TEACHER_ME_KEY,
  LOADING_TIP_FAVORITES_KEY,
  LOADING_TIP_HIDDEN_KEY,
]

/**
 * 清除用户级 / 账号级本地存储。
 *
 * 公用电脑场景：登录、登出（含 401 强制登出）后不得留下上一账号的身份缓存与表单草稿。
 * 设备级偏好（主题、AI 悬浮球位置、快捷入口等）不在清理范围。
 *
 * 草稿与撤回标记存储为 `<键>::u<id>`：只能清当前用户命名空间，
 * 按前缀整批删除会让同浏览器其他账号的未提交草稿一并消失。
 *
 * 注意：本函数只处理 localStorage，不涉及各 Pinia store 的内存态
 * （shared 层按分层红线不得 import app 层 store；forceLogout 会整页 reload，内存态自然消失）。
 */
export function clearUserScopedStorage(): void {
  if (typeof window === 'undefined') return
  try {
    // 必须先按命名空间清理：getStorageScope() 依赖 user_info_cache，
    // 先删身份缓存会让作用域退化为 anonymous，当前用户的 `::u<id>` 键将漏删。
    clearCurrentUserScopedStorage(USER_SCOPED_PREFIXES)
    for (const key of USER_SCOPED_KEYS) {
      localStorage.removeItem(key)
    }
  } catch {
    // localStorage 不可用（隐私模式等）时静默降级
  }
}
