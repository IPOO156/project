import type { CurrentUser } from '@/shared/types/teacher'
import { ref } from 'vue'
import { getCurrentUser } from '@/shared/api/teacher'

const STORAGE_KEY = 'teacher_me'

function readCache(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CurrentUser) : null
  } catch {
    return null
  }
}

const me = ref<CurrentUser | null>(readCache())

/**
 * 教师当前登录者身份（含 roles / permissions / scopes）
 *
 * 登录后调用 refresh() 从后端 /auth/me 拉取并持久化到 localStorage；
 * 教师端页面据此做角色判断与「学院→专业→班级」数据范围过滤。
 */
export function useTeacherMe() {
  async function refresh(): Promise<CurrentUser | null> {
    try {
      const data = await getCurrentUser()
      me.value = data
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
      return data
    } catch {
      return null
    }
  }

  function clear() {
    me.value = null
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }

  return { me, refresh, clear }
}
