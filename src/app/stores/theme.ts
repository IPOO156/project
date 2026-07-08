import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'app_theme_mode'
const ROOT_ATTR = 'data-theme'
const DARK_CLASS = 'dark'

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function writeTheme(theme: ThemeMode) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // 隐私模式或存储已满时静默失败
  }
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute(ROOT_ATTR, theme)
  if (theme === 'dark') {
    root.classList.add(DARK_CLASS)
  } else {
    root.classList.remove(DARK_CLASS)
  }
}

/**
 * 全局主题状态
 * - 支持 light / dark 两套主题
 * - 主题偏好持久化到 localStorage
 * - 通过 data-theme 属性驱动 CSS 变量切换
 * - 登录时若用户无手动偏好，根据时间段自动切换（6:00-18:00 日间，18:00-6:00 夜间）
 */
export const useThemeStore = defineStore('theme', () => {
  const theme: Ref<ThemeMode> = ref(readTheme())

  // 初始化时立即应用，避免刷新闪烁
  applyTheme(theme.value)

  const isDark = computed(() => theme.value === 'dark')

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    writeTheme(mode)
    applyTheme(mode)
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  /**
   * 根据当前时间自动切换主题（仅在用户无手动偏好时生效）
   * 日间 6:00-18:00 → light，夜间 18:00-6:00 → dark
   */
  function applyTimeBasedTheme() {
    // 已有本地存储的偏好（用户手动设置过），不覆盖
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) {
      return
    }
    const hour = new Date().getHours()
    const timeBased: ThemeMode = hour >= 6 && hour < 18 ? 'light' : 'dark'
    setTheme(timeBased)
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    applyTimeBasedTheme,
  }
})
