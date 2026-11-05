import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useDebounce } from '@/shared/composables/useDebounce'
import { useDict } from '@/shared/composables/useDict'
import { usePagination } from '@/shared/composables/usePagination'
import { useTableQuery } from '@/shared/composables/useTableQuery'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('300ms 内多次触发只执行最后一次', () => {
    const scope = effectScope()
    const fn = vi.fn()
    scope.run(() => {
      const { run } = useDebounce(fn)
      run()
      run()
      run()
    })

    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('cancel 与 scope 销毁都会取消未执行的调用', () => {
    const scope = effectScope()
    const fn = vi.fn()
    let cancel = () => {}
    scope.run(() => {
      const api = useDebounce(fn)
      cancel = api.cancel
      api.run()
    })
    cancel()
    vi.advanceTimersByTime(400)
    expect(fn).not.toHaveBeenCalled()

    scope.run(() => useDebounce(fn).run())
    scope.stop()
    vi.advanceTimersByTime(400)
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('useDict', () => {
  const dict = {
    A: { label: '甲', color: 'green' },
    B: { label: '乙' },
  } as const

  it('按值取文案与颜色，未知值回落原值', () => {
    const { getLabel, getColor } = useDict(dict)
    expect(getLabel('A')).toBe('甲')
    expect(getColor('A')).toBe('green')
    expect(getColor('B')).toBeUndefined()
    expect(getLabel('Z')).toBe('Z')
  })

  it('转成下拉选项时保留顺序与颜色', () => {
    const { getOptions } = useDict(dict)
    expect(getOptions()).toEqual([
      { label: '甲', value: 'A', color: 'green' },
      { label: '乙', value: 'B', color: undefined },
    ])
  })
})

describe('usePagination', () => {
  it('数组响应按条数作为总数', async () => {
    const fetchFn = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }])
    const page = usePagination(fetchFn)

    await page.fetchData()

    expect(page.list.value).toHaveLength(2)
    expect(page.total.value).toBe(2)
    expect(page.loading.value).toBe(false)
    expect(fetchFn).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10 })
  })

  it('分页响应读取 list / total，缺失时回落空值', async () => {
    const page = usePagination(vi.fn().mockResolvedValue({ list: [{ id: 1 }], total: 30 }))
    await page.fetchData({ keyword: 'x' })
    expect(page.total.value).toBe(30)

    const empty = usePagination(vi.fn().mockResolvedValue({}))
    await empty.fetchData()
    expect(empty.list.value).toEqual([])
    expect(empty.total.value).toBe(0)
  })

  it('翻页与改页大小会重新请求，改页大小时回到第一页', async () => {
    const fetchFn = vi.fn().mockResolvedValue([])
    const page = usePagination(fetchFn)

    page.pagination.value.onChange(3)
    expect(page.pageNum.value).toBe(3)
    await Promise.resolve()
    expect(fetchFn).toHaveBeenLastCalledWith({ pageNum: 3, pageSize: 10 })

    page.pagination.value.onPageSizeChange(50)
    expect(page.pageNum.value).toBe(1)
    expect(page.pageSize.value).toBe(50)
    await Promise.resolve()
    expect(fetchFn).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 50 })
  })

  it('请求异常时仍复位 loading', async () => {
    const page = usePagination(vi.fn().mockRejectedValue(new Error('boom')))
    await expect(page.fetchData()).rejects.toThrow('boom')
    expect(page.loading.value).toBe(false)
  })
})

describe('useTableQuery', () => {
  it('搜索回到第一页并带上表单条件', async () => {
    const fetchFn = vi.fn().mockResolvedValue([])
    const query = useTableQuery(fetchFn, { keyword: '' })

    query.searchForm.keyword = '蓝桥'
    await query.handleSearch()

    expect(query.pagination.value.currentPage).toBe(1)
    expect(fetchFn).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10, keyword: '蓝桥' })
  })

  it('重置会恢复默认表单后重新查询', async () => {
    const fetchFn = vi.fn().mockResolvedValue([])
    const query = useTableQuery(fetchFn, { keyword: '', status: '1' })

    query.searchForm.keyword = '临时'
    query.searchForm.status = '9'
    await query.handleReset()

    expect(query.searchForm).toEqual({ keyword: '', status: '1' })
    expect(fetchFn).toHaveBeenLastCalledWith({ pageNum: 1, pageSize: 10, keyword: '', status: '1' })
  })

  it('外部传入的额外条件覆盖表单同名字段', async () => {
    const fetchFn = vi.fn().mockResolvedValue([])
    const query = useTableQuery(fetchFn, { status: '1' })

    await query.fetchData({ status: '2' })

    expect(fetchFn).toHaveBeenCalledWith({ pageNum: 1, pageSize: 10, status: '2' })
  })
})
