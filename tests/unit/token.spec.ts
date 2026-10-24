// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAuth,
  getRefreshToken,
  getToken,
  initAuthState,
  setRefreshToken,
  setToken,
  writeTokenPreservingSource,
} from '@/shared/utils/token'

const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refresh_token'
const REMEMBER_KEY = 'remember_me'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('getToken 读取优先级', () => {
  it('sessionStorage 优先于 localStorage', () => {
    localStorage.setItem(TOKEN_KEY, 'from-local')
    sessionStorage.setItem(TOKEN_KEY, 'from-session')
    expect(getToken()).toBe('from-session')
  })

  it('session 为空时回落到 localStorage', () => {
    localStorage.setItem(TOKEN_KEY, 'from-local')
    expect(getToken()).toBe('from-local')
  })

  it('两处都没有时返回空串（不返回 null）', () => {
    expect(getToken()).toBe('')
  })
})

describe('setToken 存储策略', () => {
  it('未勾选记住我：仅写 session，并清掉 local 残留', () => {
    localStorage.setItem(TOKEN_KEY, 'stale')
    setToken('abc')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('abc')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REMEMBER_KEY)).toBeNull()
  })

  it('勾选记住我：写 local、清 session，并落 remember 标记', () => {
    sessionStorage.setItem(TOKEN_KEY, 'stale')
    setToken('abc', true)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REMEMBER_KEY)).toBe('1')
  })

  it('refreshToken 与 token 使用同一存储策略', () => {
    setRefreshToken('r1', true)
    expect(localStorage.getItem(REFRESH_KEY)).toBe('r1')
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
    expect(getRefreshToken()).toBe('r1')
  })
})

describe('writeTokenPreservingSource', () => {
  it('沿用「记住我」策略，不会把持久登录降级为会话级', () => {
    localStorage.setItem(REMEMBER_KEY, '1')
    writeTokenPreservingSource('new-token', 'new-refresh')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token')
    expect(localStorage.getItem(REFRESH_KEY)).toBe('new-refresh')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('未记住我时写回 session', () => {
    writeTokenPreservingSource('new-token')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('new-token')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('clearAuth', () => {
  it('双存储的 token / refresh / remember 全部清空', () => {
    localStorage.setItem(TOKEN_KEY, 't')
    localStorage.setItem(REFRESH_KEY, 'r')
    localStorage.setItem(REMEMBER_KEY, '1')
    sessionStorage.setItem(TOKEN_KEY, 't2')
    sessionStorage.setItem(REFRESH_KEY, 'r2')

    clearAuth()

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
    expect(localStorage.getItem(REMEMBER_KEY)).toBeNull()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(sessionStorage.getItem(REFRESH_KEY)).toBeNull()
  })
})

describe('initAuthState 启动清理', () => {
  it('清除无「记住我」标记的历史遗留令牌', () => {
    localStorage.setItem(TOKEN_KEY, 'orphan')
    localStorage.setItem(REFRESH_KEY, 'orphan-refresh')
    initAuthState()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('用户主动记住的令牌不受影响', () => {
    localStorage.setItem(TOKEN_KEY, 'kept')
    localStorage.setItem(REMEMBER_KEY, '1')
    initAuthState()
    expect(localStorage.getItem(TOKEN_KEY)).toBe('kept')
  })
})
