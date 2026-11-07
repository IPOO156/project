import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ getSemesters: vi.fn(), warning: vi.fn() }))

vi.mock('@/shared/api/common', () => ({ getSemesters: api.getSemesters }))
vi.mock('element-plus', () => ({ ElMessage: { warning: api.warning } }))

type SemestersModule = typeof import('@/shared/composables/useSemesters')

async function freshModule(): Promise<SemestersModule> {
  vi.resetModules()
  return import('@/shared/composables/useSemesters')
}

beforeEach(() => {
  api.getSemesters.mockReset()
  api.warning.mockReset()
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

  it('并发调用只发一次请求，后续 load 复用结果', async () => {
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

    await load()
    expect(api.getSemesters).toHaveBeenCalledTimes(1)
  })

  it('后端返回空数组时列表为空，记录原因并就地提示', async () => {
    api.getSemesters.mockResolvedValue([])

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load } = useSemesters()
    await load()

    expect(semesterOptions.value).toEqual([])
    expect(error.value).toBe('学期数据为空')
    expect(api.warning).toHaveBeenCalledWith('学期数据未配置，请联系管理员')
  })

  it('请求失败时记录 Error message，不重复弹提示', async () => {
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

  it('reload 忽略缓存重新拉取，成功后清除兜底原因', async () => {
    api.getSemesters.mockResolvedValueOnce([])
    api.getSemesters.mockResolvedValueOnce([
      { value: 1, name: '2030-2031-2', label: '未来学期', isCurrent: 0 },
    ])

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load, reload } = useSemesters()

    await load()
    expect(error.value).toBe('学期数据为空')

    await reload()
    expect(api.getSemesters).toHaveBeenCalledTimes(2)
    expect(error.value).toBeNull()
    expect(semesterOptions.value).toEqual([{ value: '2030-2031-2', label: '未来学期' }])
  })
})
