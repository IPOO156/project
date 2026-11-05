// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DRAFT_PREFIX,
  LOADING_TIP_FAVORITES_KEY,
  LOADING_TIP_HIDDEN_KEY,
  TEACHER_ME_KEY,
  USER_AVATAR_CACHE_KEY,
  USER_INFO_CACHE_KEY,
} from '@/shared/constants/storageKeys'
import { clearUserScopedStorage } from '@/shared/utils/session'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

function loginAs(id: string | number) {
  localStorage.setItem(USER_INFO_CACHE_KEY, JSON.stringify({ id }))
}

describe('clearUserScopedStorage', () => {
  it('清空 5 个账号级固定键', () => {
    const scopedKeys = [
      USER_INFO_CACHE_KEY,
      USER_AVATAR_CACHE_KEY,
      TEACHER_ME_KEY,
      LOADING_TIP_FAVORITES_KEY,
      LOADING_TIP_HIDDEN_KEY,
    ]
    scopedKeys.forEach((key) => localStorage.setItem(key, 'x'))

    clearUserScopedStorage()

    scopedKeys.forEach((key) => expect(localStorage.getItem(key)).toBeNull())
  })

  it('按命名空间清除当前用户与 anonymous 的草稿与撤回标记', () => {
    loginAs(2)
    localStorage.setItem(`${DRAFT_PREFIX}career-plan::u2`, '{}')
    localStorage.setItem(`${DRAFT_PREFIX}competition::anonymous`, '{}')
    localStorage.setItem('submission:withdrawnIds::u2', '["1"]')

    clearUserScopedStorage()

    expect(localStorage.getItem(`${DRAFT_PREFIX}career-plan::u2`)).toBeNull()
    expect(localStorage.getItem(`${DRAFT_PREFIX}competition::anonymous`)).toBeNull()
    expect(localStorage.getItem('submission:withdrawnIds::u2')).toBeNull()
  })

  it('不误删其他账号命名空间下的草稿', () => {
    loginAs(2)
    localStorage.setItem(`${DRAFT_PREFIX}career-plan::u9`, '{}')

    clearUserScopedStorage()

    expect(localStorage.getItem(`${DRAFT_PREFIX}career-plan::u9`)).not.toBeNull()
  })

  it('先按命名空间清理再删身份缓存（否则作用域退化为 anonymous 漏删）', () => {
    loginAs(5)
    localStorage.setItem(`${DRAFT_PREFIX}x::u5`, '{}')

    clearUserScopedStorage()

    expect(localStorage.getItem(`${DRAFT_PREFIX}x::u5`)).toBeNull()
    expect(localStorage.getItem(USER_INFO_CACHE_KEY)).toBeNull()
  })

  it('保留设备级偏好（主题、悬浮球位置等）', () => {
    localStorage.setItem('app_theme_mode', 'dark')
    localStorage.setItem('ai_float_position', '{"x":1,"y":2}')

    clearUserScopedStorage()

    expect(localStorage.getItem('app_theme_mode')).toBe('dark')
    expect(localStorage.getItem('ai_float_position')).toBe('{"x":1,"y":2}')
  })

  it('sessionStorage 不在清理范围（令牌独立管理）', () => {
    sessionStorage.setItem('token', 'session-token')
    clearUserScopedStorage()
    expect(sessionStorage.getItem('token')).toBe('session-token')
  })

  it('存储不可用时静默降级（隐私模式）', () => {
    const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(() => clearUserScopedStorage()).not.toThrow()

    spy.mockRestore()
  })

  it('非浏览器环境（SSR / 单测 node 环境）直接返回', () => {
    vi.stubGlobal('window', undefined)
    expect(() => clearUserScopedStorage()).not.toThrow()
    vi.unstubAllGlobals()
  })
})
