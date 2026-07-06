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

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
})
