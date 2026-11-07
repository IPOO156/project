import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'

const api = vi.hoisted(() => ({ getSemesters: vi.fn() }))

vi.mock('@/shared/api/common', () => ({ getSemesters: api.getSemesters }))

type SemestersModule = typeof import('@/shared/composables/useSemesters')

const LOCAL_VALUES = SEMESTER_OPTIONS.map((s) => s.value)

async function freshModule(): Promise<SemestersModule> {
  vi.resetModules()
  return import('@/shared/composables/useSemesters')
}

beforeEach(() => {
  api.getSemesters.mockReset()
})

describe('useSemesters', () => {
  it('初始即为本地兜底列表，未请求前不报错', async () => {
    const { useSemesters } = await freshModule()
    const { semesterOptions, error, loading } = useSemesters()

    expect(semesterOptions.value.map((s) => s.value)).toEqual(LOCAL_VALUES)
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('后端学期与本地区间取并集、按名称升序，同名以后端 label 为准', async () => {
    api.getSemesters.mockResolvedValue([
      { value: 1, name: '2024-2025-1', label: '2024-2025 学年第一学期', isCurrent: 1 },
      { value: 2, name: '2030-2031-1', label: '', isCurrent: 0 },
    ])

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load } = useSemesters()
    await load()

    const values = semesterOptions.value.map((s) => s.value)
    expect(values).toEqual([...values].sort((a, b) => a.localeCompare(b)))
    expect(values).toContain('2030-2031-1')
    expect(semesterOptions.value).toHaveLength(LOCAL_VALUES.length + 1)
    expect(semesterOptions.value.find((s) => s.value === '2024-2025-1')?.label).toBe(
      '2024-2025 学年第一学期',
    )
    expect(semesterOptions.value.find((s) => s.value === '2030-2031-1')?.label).toBe('2030-2031-1')
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

  it('后端返回空数组时退化为本地列表并给出原因', async () => {
    api.getSemesters.mockResolvedValue([])

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load } = useSemesters()
    await load()

    expect(semesterOptions.value.map((s) => s.value)).toEqual(LOCAL_VALUES)
    expect(error.value).toBe('学期数据为空，已退化为本地列表')
  })

  it('请求失败时退化为本地列表，Error 取 message', async () => {
    api.getSemesters.mockRejectedValue(new Error('接口 500'))

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load } = useSemesters()
    await load()

    expect(semesterOptions.value.map((s) => s.value)).toEqual(LOCAL_VALUES)
    expect(error.value).toBe('接口 500')
  })

  it('非 Error 异常使用通用兜底文案', async () => {
    api.getSemesters.mockRejectedValue('boom')

    const { useSemesters } = await freshModule()
    const { error, load } = useSemesters()
    await load()

    expect(error.value).toBe('学期数据加载失败，已退化为本地列表')
  })

  it('reload 忽略缓存重新拉取，成功后清除兜底原因', async () => {
    api.getSemesters.mockResolvedValueOnce([])
    api.getSemesters.mockResolvedValueOnce([
      { value: 1, name: '2030-2031-2', label: '未来学期', isCurrent: 0 },
    ])

    const { useSemesters } = await freshModule()
    const { semesterOptions, error, load, reload } = useSemesters()

    await load()
    expect(error.value).toBe('学期数据为空，已退化为本地列表')

    await reload()
    expect(api.getSemesters).toHaveBeenCalledTimes(2)
    expect(error.value).toBeNull()
    expect(semesterOptions.value.find((s) => s.value === '2030-2031-2')?.label).toBe('未来学期')
  })
})
