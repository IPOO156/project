import { defineStore } from 'pinia'
import { ref } from 'vue'
import bookCursor from '@/shared/utils/bookCursor'

const STORAGE_KEY = 'app_book_cursor_enabled'

function readEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // 默认关闭：书册光标改为用户显式开启后才生效
    return raw === '1'
  } catch {
    return false
  }
}

function writeEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // 隐私模式或存储已满时静默失败
  }
}

/**
 * 书册光标偏好
 * - 学生端默认开启，教师/管理员端始终关闭
 * - 偏好持久化到 localStorage，刷新后沿用
 */
export const useCursorStore = defineStore('cursor', () => {
  const enabled = ref(readEnabled())

  function apply(isTeacher: boolean) {
    if (isTeacher || !enabled.value) bookCursor.disable()
    else bookCursor.enable()
  }

  /** 离开业务布局（登录/404 等 noLayout 页面）时关闭 */
  function disable() {
    bookCursor.disable()
  }

  function setEnabled(next: boolean, isTeacher = false) {
    enabled.value = next
    writeEnabled(next)
    apply(isTeacher)
  }

  function toggle(isTeacher = false) {
    setEnabled(!enabled.value, isTeacher)
  }

  return { enabled, setEnabled, toggle, apply, disable }
})
