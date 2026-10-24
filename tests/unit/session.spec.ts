// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DRAFT_PREFIX,
  LOADING_TIP_FAVORITES_KEY,
  LOADING_TIP_HIDDEN_KEY,
  SUBMISSION_WITHDRAWN_KEY,
  TEACHER_ME_KEY,
  USER_AVATAR_CACHE_KEY,
  USER_INFO_CACHE_KEY,
} from '@/shared/constants/storageKeys'
import { clearUserScopedStorage } from '@/shared/utils/session'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('clearUserScopedStorage', () => {
  it('清空全部 6 个账号级固定键', () => {
    const scopedKeys = [
      USER_INFO_CACHE_KEY,
      USER_AVATAR_CACHE_KEY,
      TEACHER_ME_KEY,
      SUBMISSION_WITHDRAWN_KEY,
      LOADING_TIP_FAVORITES_KEY,
      LOADING_TIP_HIDDEN_KEY,
    ]
    scopedKeys.forEach((key) => localStorage.setItem(key, 'x'))

    clearUserScopedStorage()

    scopedKeys.forEach((key) => expect(localStorage.getItem(key)).toBeNull())
  })

  it('按前缀清除全部表单草稿', () => {
    localStorage.setItem(`${DRAFT_PREFIX}career-plan`, '{}')
    localStorage.setItem(`${DRAFT_PREFIX}competition`, '{}')

    clearUserScopedStorage()

    expect(localStorage.getItem(`${DRAFT_PREFIX}career-plan`)).toBeNull()
    expect(localStorage.getItem(`${DRAFT_PREFIX}competition`)).toBeNull()
  })

  it('保留设备级偏好（主题、悬浮球位置等）', () => {
    localStorage.setItem('app_theme_mode', 'dark')
    localStorage.setItem('ai_float_position', '{"x":1,"y":2}')

    clearUserScopedStorage()

    expect(localStorage.getItem('app_theme_mode')).toBe('dark')
    expect(localStorage.getItem('ai_float_position')).toBe('{"x":1,"y":2}')
  })

  it('按前缀匹配清除（含同前缀变体）', () => {
    localStorage.setItem('form_draft_v2', 'another-draft')
    // 前缀是 form_draft_，form_draft_v2 同样命中，属预期行为
    clearUserScopedStorage()
    expect(localStorage.getItem('form_draft_v2')).toBeNull()
  })

  it('sessionStorage 不在清理范围（令牌独立管理）', () => {
    sessionStorage.setItem('token', 'session-token')
    clearUserScopedStorage()
    expect(sessionStorage.getItem('token')).toBe('session-token')
  })
})
