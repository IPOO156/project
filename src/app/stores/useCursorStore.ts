import { defineStore } from 'pinia'
import { ref } from 'vue'
import bookCursor from '@/shared/utils/bookCursor'

const STORAGE_KEY = 'app_book_cursor_enabled'

function readEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? true : raw === '1'
  } catch {
    return true
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

  function setEnabled(next: boolean, isTeacher = false) {
    enabled.value = next
    writeEnabled(next)
    apply(isTeacher)
  }

  function toggle(isTeacher = false) {
    setEnabled(!enabled.value, isTeacher)
  }

  return { enabled, setEnabled, toggle, apply }
})
