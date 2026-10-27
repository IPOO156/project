// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getHomeDashboard: vi.fn() }))

vi.mock('@/shared/api/student', () => ({ getHomeDashboard: mocks.getHomeDashboard }))

const { useHomeStore } = await import('@/app/stores/useHomeStore')

beforeEach(() => {
  setActivePinia(createPinia())
  mocks.getHomeDashboard.mockReset()
})

describe('useHomeStore', () => {
  it('首次拉取写入看板数据', async () => {
    mocks.getHomeDashboard.mockResolvedValue({ studentName: '张三' })
    const store = useHomeStore()

    await store.fetchDashboard()

    expect(store.data).toEqual({ studentName: '张三' })
    expect(store.loading).toBe(false)
  })

  it('60s 内复用缓存，force 时强制回源', async () => {
    mocks.getHomeDashboard.mockResolvedValue({ studentName: '张三' })
    const store = useHomeStore()

    await store.fetchDashboard()
    await store.fetchDashboard()
    expect(mocks.getHomeDashboard).toHaveBeenCalledTimes(1)

    await store.fetchDashboard(true)
    expect(mocks.getHomeDashboard).toHaveBeenCalledTimes(2)
  })

  it('并发调用共享同一个在途请求', async () => {
    mocks.getHomeDashboard.mockResolvedValue({})
    const store = useHomeStore()

    await Promise.all([store.fetchDashboard(), store.fetchDashboard()])

    expect(mocks.getHomeDashboard).toHaveBeenCalledTimes(1)
  })

  it('接口失败清空数据且不抛出', async () => {
    mocks.getHomeDashboard.mockRejectedValue(new Error('boom'))
    const store = useHomeStore()

    await expect(store.fetchDashboard()).resolves.toBeUndefined()
    expect(store.data).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('reset 复位缓存，下次拉取会重新请求', async () => {
    mocks.getHomeDashboard.mockResolvedValue({})
    const store = useHomeStore()
    await store.fetchDashboard()

    store.reset()
    expect(store.data).toBeNull()

    await store.fetchDashboard()
    expect(mocks.getHomeDashboard).toHaveBeenCalledTimes(2)
  })
})
