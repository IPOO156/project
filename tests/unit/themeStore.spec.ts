// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useThemeStore } from '@/app/stores/useThemeStore'

function resetDom() {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.classList.remove('dark')
}

beforeEach(() => {
  resetDom()
  setActivePinia(createPinia())
})

afterEach(() => vi.useRealTimers())

describe('useThemeStore', () => {
  it('无本地偏好时默认日间，并写入根节点属性', () => {
    const store = useThemeStore()

    expect(store.theme).toBe('light')
    expect(store.isDark).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('读取本地偏好为夜间时同步根节点 dark 类', () => {
    localStorage.setItem('app_theme_mode', 'dark')

    const store = useThemeStore()

    expect(store.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme 同时持久化与更新 DOM', () => {
    const store = useThemeStore()

    store.setTheme('dark')

    expect(localStorage.getItem('app_theme_mode')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme 在明暗之间切换', () => {
    const store = useThemeStore()

    store.toggleTheme()
    expect(store.theme).toBe('dark')

    store.toggleTheme()
    expect(store.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('已有手动偏好时，按时间自动切换不覆盖', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 25, 22, 0, 0))
    localStorage.setItem('app_theme_mode', 'light')

    const store = useThemeStore()
    store.applyTimeBasedTheme()

    expect(store.theme).toBe('light')
  })

  it('无手动偏好时按时间切换（夜间 → dark）', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 25, 22, 0, 0))

    const store = useThemeStore()
    store.applyTimeBasedTheme()

    expect(store.theme).toBe('dark')
    expect(localStorage.getItem('app_theme_mode')).toBe('dark')
  })
})
