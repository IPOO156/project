// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearCurrentUserScopedStorage,
  getStorageScope,
  scopedStorageKey,
} from '@/shared/utils/storageScope'

beforeEach(() => localStorage.clear())

function loginAs(id: string | number, extra: Record<string, unknown> = {}) {
  localStorage.setItem('user_info_cache', JSON.stringify({ id, ...extra }))
}

describe('getStorageScope', () => {
  it('未登录或缓存不可用时落到 anonymous', () => {
    expect(getStorageScope()).toBe('anonymous')

    localStorage.setItem('user_info_cache', '{bad json')
    expect(getStorageScope()).toBe('anonymous')

    localStorage.setItem('user_info_cache', JSON.stringify({ id: '' }))
    expect(getStorageScope()).toBe('anonymous')
  })

  it('优先 id，其次 studentId / username', () => {
    loginAs(2)
    expect(getStorageScope()).toBe('u2')

    localStorage.setItem('user_info_cache', JSON.stringify({ studentId: 'S9' }))
    expect(getStorageScope()).toBe('uS9')

    localStorage.setItem('user_info_cache', JSON.stringify({ username: 'zhangsan' }))
    expect(getStorageScope()).toBe('uzhangsan')
  })
})

describe('scopedStorageKey', () => {
  it('拼接当前用户命名空间', () => {
    loginAs(7)
    expect(scopedStorageKey('form_draft_x')).toBe('form_draft_x::u7')
  })
})

describe('clearCurrentUserScopedStorage', () => {
  it('只清当前用户与 anonymous 命名空间下匹配前缀的键', () => {
    loginAs(2)
    localStorage.setItem('form_draft_a::u2', '1')
    localStorage.setItem('submission:withdrawnIds::u2', '["1"]')
    localStorage.setItem('form_draft_b::anonymous', '1')

    localStorage.setItem('form_draft_c::u9', '1') // 其他账号，不能删
    localStorage.setItem('submission:keep::u2', '1') // 前缀不匹配，不能删

    clearCurrentUserScopedStorage(['form_draft_', 'submission:withdrawnIds'])

    expect(localStorage.getItem('form_draft_a::u2')).toBeNull()
    expect(localStorage.getItem('submission:withdrawnIds::u2')).toBeNull()
    expect(localStorage.getItem('form_draft_b::anonymous')).toBeNull()
    expect(localStorage.getItem('form_draft_c::u9')).not.toBeNull()
    expect(localStorage.getItem('submission:keep::u2')).not.toBeNull()
    expect(localStorage.getItem('user_info_cache')).not.toBeNull()
  })

  it('无匹配键时静默返回', () => {
    loginAs(3)
    expect(() => clearCurrentUserScopedStorage(['not_exists_'])).not.toThrow()
  })
})
