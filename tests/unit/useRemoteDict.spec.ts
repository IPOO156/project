import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ getDict: vi.fn() }))

vi.mock('@/shared/api/common', () => ({ getDict: api.getDict }))

type RemoteDictModule = typeof import('@/shared/composables/useRemoteDict')

async function freshModule(): Promise<RemoteDictModule> {
  vi.resetModules()
  return import('@/shared/composables/useRemoteDict')
}

const FALLBACK = [
  { value: 'fallback_a', label: '兜底 A' },
  { value: 'fallback_b', label: '兜底 B' },
]

beforeEach(() => {
  api.getDict.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useRemoteDict', () => {
  it('初始展示 fallback 的副本，不与常量数组共享引用', async () => {
    const { useRemoteDict } = await freshModule()
    const { options } = useRemoteDict('award_level', FALLBACK)

    expect(options.value).toEqual(FALLBACK)
    expect(options.value).not.toBe(FALLBACK)
    expect(api.getDict).not.toHaveBeenCalled()
  })

  it('后端非空时覆盖 fallback，并过滤空值/重复项、保持后端顺序', async () => {
    api.getDict.mockResolvedValue([
      { value: 'second', label: '二等奖', sort: 3 },
      { value: ' first ', label: ' 一等奖 ', sort: 2 },
      { value: 'first', label: '重复项', sort: 1 },
      { value: '', label: '空值' },
      { value: 'x', label: '' },
      null,
    ])
    const { useRemoteDict } = await freshModule()
    const { options, load } = useRemoteDict('award_level', FALLBACK)

    await load()

    expect(api.getDict).toHaveBeenCalledWith('award_level')
    expect(options.value).toEqual([
      { value: 'second', label: '二等奖' },
      { value: 'first', label: '一等奖' },
    ])
  })

  it('后端返回空数组时保留 fallback，并写入负缓存避免立即重试', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getDict.mockResolvedValue([])
    const { useRemoteDict } = await freshModule()
    const { options, load } = useRemoteDict('competition_type', FALLBACK)

    await load()
    expect(options.value).toEqual(FALLBACK)
    expect(api.getDict).toHaveBeenCalledTimes(1)

    await load()
    expect(api.getDict).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(60_001)
    await load()
    expect(api.getDict).toHaveBeenCalledTimes(2)
  })

  it('请求失败时保留 fallback，负缓存到期后重试并可恢复', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getDict.mockRejectedValue(new Error('network'))
    const { useRemoteDict } = await freshModule()
    const { options, load } = useRemoteDict('project_level', FALLBACK)

    await load()
    expect(options.value).toEqual(FALLBACK)
    expect(api.getDict).toHaveBeenCalledTimes(1)

    await load()
    expect(api.getDict).toHaveBeenCalledTimes(1)

    api.getDict.mockResolvedValue([{ value: 'national', label: '国家级', sort: 1 }])
    vi.advanceTimersByTime(60_001)
    await load()
    expect(api.getDict).toHaveBeenCalledTimes(2)
    expect(options.value).toEqual([{ value: 'national', label: '国家级' }])
  })

  it('并发调用同一 dictType 只发一次请求', async () => {
    let resolveList: (value: unknown) => void = () => {}
    api.getDict.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve
        }),
    )
    const { useRemoteDict } = await freshModule()
    const first = useRemoteDict('industry_type', FALLBACK)
    const second = useRemoteDict('industry_type', FALLBACK)

    const pending = Promise.all([first.load(), second.load()])
    expect(api.getDict).toHaveBeenCalledTimes(1)

    resolveList([{ value: 'internet', label: '互联网/信息技术', sort: 1 }])
    await pending

    expect(first.options.value).toEqual([{ value: 'internet', label: '互联网/信息技术' }])
    expect(second.options.value).toEqual([{ value: 'internet', label: '互联网/信息技术' }])
  })

  it('不同页面共享同一 dictType 的缓存', async () => {
    api.getDict.mockResolvedValue([{ value: 'school', label: '校级', sort: 1 }])
    const { useRemoteDict } = await freshModule()
    const first = useRemoteDict('organization_level', FALLBACK)
    await first.load()

    const second = useRemoteDict('organization_level', FALLBACK)
    await second.load()

    expect(api.getDict).toHaveBeenCalledTimes(1)
    expect(second.options.value).toEqual([{ value: 'school', label: '校级' }])
  })

  it('不同 dictType 的缓存互不影响', async () => {
    api.getDict.mockImplementation((dictType: string) =>
      Promise.resolve([{ value: dictType, label: dictType, sort: 1 }]),
    )
    const { useRemoteDict } = await freshModule()
    const first = useRemoteDict('award_level', FALLBACK)
    const second = useRemoteDict('project_level', FALLBACK)

    await first.load()
    await second.load()

    expect(api.getDict).toHaveBeenCalledTimes(2)
    expect(first.options.value[0].value).toBe('award_level')
    expect(second.options.value[0].value).toBe('project_level')
  })

  it('连续失败达到阈值后停止自动请求，全部走 fallback', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getDict.mockRejectedValue(new Error('network'))
    const { useRemoteDict } = await freshModule()

    for (const type of ['a', 'b', 'c']) {
      const { load } = useRemoteDict(type, FALLBACK)
      await load()
    }
    expect(api.getDict).toHaveBeenCalledTimes(3)

    vi.advanceTimersByTime(60_001)
    const { options, load } = useRemoteDict('d', FALLBACK)
    await load()

    expect(api.getDict).toHaveBeenCalledTimes(3)
    expect(options.value).toEqual(FALLBACK)
  })

  it('reload 绕过缓存强制刷新', async () => {
    api.getDict.mockResolvedValueOnce([{ value: 'first', label: '一等奖', sort: 1 }])
    api.getDict.mockResolvedValueOnce([{ value: 'special', label: '特等奖', sort: 1 }])
    const { useRemoteDict } = await freshModule()
    const { options, load, reload } = useRemoteDict('award_level', FALLBACK)

    await load()
    expect(options.value).toEqual([{ value: 'first', label: '一等奖' }])

    await load()
    expect(api.getDict).toHaveBeenCalledTimes(1)

    await reload()
    expect(api.getDict).toHaveBeenCalledTimes(2)
    expect(options.value).toEqual([{ value: 'special', label: '特等奖' }])
  })

  it('返回给调用方的 options 与缓存隔离，修改不会污染其他页面', async () => {
    api.getDict.mockResolvedValue([{ value: 'school', label: '校级', sort: 1 }])
    const { useRemoteDict } = await freshModule()
    const first = useRemoteDict('project_level', FALLBACK)
    await first.load()
    first.options.value[0].label = '被修改'

    const second = useRemoteDict('project_level', FALLBACK)
    await second.load()

    expect(second.options.value).toEqual([{ value: 'school', label: '校级' }])
  })

  it('接口返回非数组时安全回退 fallback', async () => {
    api.getDict.mockResolvedValue(null)
    const { useRemoteDict } = await freshModule()
    const { options, load } = useRemoteDict('competition_level', FALLBACK)

    await load()

    expect(options.value).toEqual(FALLBACK)
  })

  it('clearRemoteDictCache 后重新请求', async () => {
    api.getDict.mockResolvedValue([{ value: 'school', label: '校级', sort: 1 }])
    const { useRemoteDict, clearRemoteDictCache } = await freshModule()
    const { load } = useRemoteDict('project_level', FALLBACK)
    await load()
    expect(api.getDict).toHaveBeenCalledTimes(1)

    clearRemoteDictCache('project_level')
    await load()
    expect(api.getDict).toHaveBeenCalledTimes(2)
  })
})
