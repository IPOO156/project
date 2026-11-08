import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  getSemesters: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
  close: vi.fn(),
}))

vi.mock('@/shared/api/common', () => ({ getSemesters: api.getSemesters }))
vi.mock('element-plus', () => ({ ElMessage: { warning: api.warning, success: api.success } }))

type SemestersModule = typeof import('@/shared/composables/useSemesters')

async function freshModule(): Promise<SemestersModule> {
  vi.resetModules()
  return import('@/shared/composables/useSemesters')
}

/** 从第一次 warning 调用里取出常驻提示的「重新获取」按钮点击处理器 */
function getRetryButton(): { onClick: () => Promise<void> } {
  const options = api.warning.mock.calls[0][0] as { message: { children: unknown[] } }
  const children = options.message.children as { props: { onClick: () => Promise<void> } }[]
  return children[1].props
}

beforeEach(() => {
  api.getSemesters.mockReset()
  api.warning.mockReset()
  api.success.mockReset()
  api.close.mockReset()
  api.warning.mockImplementation(() => ({ close: api.close }))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSemesters', () => {
  it('初始为空的学期列表，未请求前不报错', async () => {
    const { useSemesters } = await freshModule()
    const { semesterOptions, error, loading } = useSemesters()

    expect(semesterOptions.value).toEqual([])
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('只使用后端学期，过滤无名项、label 缺失时回退名称并按名称升序', async () => {
    api.getSemesters.mockResolvedValue([
      { value: 1, name: '2024-2025-1', label: '2024-2025 学年第一学期', isCurrent: 1 },
      { value: 2, name: '2030-2031-1', label: '', isCurrent: 0 },
      { value: 3, name: '', label: '无名称项', isCurrent: 0 },
    ])

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load } = useSemesters()
    await load()

    expect(semesterOptions.value).toEqual([
      { value: '2024-2025-1', label: '2024-2025 学年第一学期' },
      { value: '2030-2031-1', label: '2030-2031-1' },
    ])
    expect(error.value).toBeNull()
  })

  it('并发调用只发一次请求，成功后锁定结果', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    let resolveList: (value: unknown) => void = () => {}
    api.getSemesters.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve
        }),
    )

    const { useSemesters } = await freshModule()
    const { load, loading } = useSemesters()

    const first = load()
    const second = load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)
    expect(loading.value).toBe(true)

    resolveList([{ value: 1, name: '2024-2025-1', label: 'x', isCurrent: 1 }])
    await Promise.all([first, second])
    expect(loading.value).toBe(false)

    // 已拿到非空数据：过多久都不再请求
    vi.advanceTimersByTime(60_000)
    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)
  })

  it('后端返回空数组时列表为空，记录原因并弹出常驻提示', async () => {
    api.getSemesters.mockResolvedValue([])

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load } = useSemesters()
    await load()

    expect(semesterOptions.value).toEqual([])
    expect(error.value).toBe('学期数据为空')
    expect(api.warning).toHaveBeenCalledTimes(1)
    expect(api.warning.mock.calls[0][0]).toMatchObject({ duration: 0, showClose: true })
    expect(api.warning.mock.calls[0][0].message).toMatchObject({ type: 'span' })
  })

  it('空数组不锁定，最短间隔内重复 load 不会重复请求', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getSemesters.mockResolvedValue([])

    const { useSemesters } = await freshModule()
    const { load } = useSemesters()

    await load()
    await load()
    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)

    // 9 秒——仍在最短间隔内，连点/快速切页面都被合并
    vi.setSystemTime(new Date('2026-11-08T09:00:09+08:00'))
    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)
  })

  it('空数组不锁定，超过最短间隔后 load 会重新请求', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getSemesters
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ value: 1, name: '2024-2025-1', label: 'x', isCurrent: 1 }])

    const { useSemesters } = await freshModule()
    const { load, error, semesterOptions } = useSemesters()

    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)
    expect(error.value).toBe('学期数据为空')

    vi.setSystemTime(new Date('2026-11-08T09:00:10+08:00'))
    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(2)
    expect(error.value).toBeNull()
    expect(semesterOptions.value).toHaveLength(1)
  })

  it('请求失败不锁定，下次 load 会重新请求，成功后锁定', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getSemesters
      .mockRejectedValueOnce(new Error('接口 500'))
      .mockResolvedValueOnce([{ value: 1, name: '2024-2025-1', label: 'x', isCurrent: 1 }])

    const { useSemesters } = await freshModule()
    const { load, error, semesterOptions } = useSemesters()

    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)
    expect(error.value).toBe('接口 500')

    vi.advanceTimersByTime(10_000)
    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(2)
    expect(error.value).toBeNull()
    expect(semesterOptions.value).toHaveLength(1)

    vi.advanceTimersByTime(60_000)
    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(2)
  })

  it('持续失败达到上限后不再请求，避免无限重试', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getSemesters.mockRejectedValue(new Error('接口 500'))

    const { useSemesters } = await freshModule()
    const { load, error } = useSemesters()

    for (let i = 0; i < 5; i += 1) {
      await load()
      vi.advanceTimersByTime(10_000)
    }

    expect(api.getSemesters).toHaveBeenCalledTimes(3)
    expect(error.value).toBe('接口 500')
  })

  it('常驻提示同一会话只弹一次，强制 reload 也不重复弹', async () => {
    api.getSemesters.mockResolvedValue([])

    const { useSemesters } = await freshModule()
    const { load, reload } = useSemesters()

    await load()
    await reload()
    await reload()

    expect(api.getSemesters).toHaveBeenCalledTimes(3)
    expect(api.warning).toHaveBeenCalledTimes(1)
    expect(api.warning.mock.calls[0][0]).toMatchObject({ duration: 0, showClose: true })
  })

  it('点击「重新获取」立即强制请求，仍为空时给出反馈', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-08T09:00:00+08:00'))
    api.getSemesters.mockResolvedValue([])

    const { useSemesters } = await freshModule()
    const { load } = useSemesters()

    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)

    // 仍在最短间隔内：按钮走 force，必须立刻发请求
    await getRetryButton().onClick()
    expect(api.getSemesters).toHaveBeenCalledTimes(2)
    expect(api.warning).toHaveBeenCalledTimes(2)
    expect(api.warning.mock.calls[1][0]).toBe('仍未获取到学期数据，请稍后重试')
  })

  it('点击「重新获取」拿到数据后关闭常驻提示并提示已更新', async () => {
    api.getSemesters
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ value: 1, name: '2024-2025-1', label: 'x', isCurrent: 1 }])

    const { useSemesters } = await freshModule()
    const { load, semesterOptions, error } = useSemesters()

    await load()
    await getRetryButton().onClick()

    expect(api.getSemesters).toHaveBeenCalledTimes(2)
    expect(api.close).toHaveBeenCalledTimes(1)
    expect(api.success).toHaveBeenCalledWith('学期数据已更新')
    expect(semesterOptions.value).toHaveLength(1)
    expect(error.value).toBeNull()
  })

  it('请求失败时记录 Error message，不弹空数据提示', async () => {
    api.getSemesters.mockRejectedValue(new Error('接口 500'))

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load } = useSemesters()
    await load()

    expect(semesterOptions.value).toEqual([])
    expect(error.value).toBe('接口 500')
    expect(api.warning).not.toHaveBeenCalled()
  })

  it('非 Error 异常使用通用兜底文案', async () => {
    api.getSemesters.mockRejectedValue('boom')

    const { useSemesters } = await freshModule()
    const { error, load } = useSemesters()
    await load()

    expect(error.value).toBe('学期数据加载失败')
  })
})
