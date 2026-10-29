// @vitest-environment jsdom
import type { SubmissionRecord } from '@/shared/types/types'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSubmissionRecords: vi.fn(),
  withdrawSubmission: vi.fn(),
  activityCategoryOf: vi.fn(() => 'archive'),
  deleteActivity: vi.fn(),
}))

vi.mock('@/shared/api/submission', () => ({
  getSubmissionRecords: mocks.getSubmissionRecords,
  withdrawSubmission: mocks.withdrawSubmission,
  activityCategoryOf: mocks.activityCategoryOf,
}))
vi.mock('@/shared/api/activities', () => ({ deleteActivity: mocks.deleteActivity }))

const { useSubmissionStore } = await import('@/app/stores/useSubmissionStore')

function record(id: string, overrides: Partial<SubmissionRecord> = {}): SubmissionRecord {
  return {
    id,
    type: 'competition',
    typeLabel: '学科竞赛',
    title: `记录${id}`,
    submitDate: '2026-10-01',
    semester: '2026-2027-1',
    status: 'approved',
    sourcePath: '',
    canEdit: true,
    canDelete: false,
    ...overrides,
  }
}

const WITHDRAWN_KEY = 'submission:withdrawnIds::u3'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('user_info_cache', JSON.stringify({ id: 3 }))
  setActivePinia(createPinia())
  mocks.getSubmissionRecords.mockReset()
  mocks.withdrawSubmission.mockReset().mockResolvedValue(undefined)
  mocks.deleteActivity.mockReset().mockResolvedValue(undefined)
  mocks.activityCategoryOf.mockReset().mockReturnValue('archive')
})

describe('useSubmissionStore.fetchRecords', () => {
  it('全量拉取写入缓存，60s 内复用不重复请求', async () => {
    mocks.getSubmissionRecords.mockResolvedValue([record('1')])
    const store = useSubmissionStore()

    await store.fetchRecords()
    await store.fetchRecords()

    expect(mocks.getSubmissionRecords).toHaveBeenCalledTimes(1)
    expect(store.records).toHaveLength(1)
    expect(store.filteredRecords).toHaveLength(1)
    expect(store.loading).toBe(false)
  })

  it('带筛选条件不算全量缓存，下一次全量仍会回源', async () => {
    mocks.getSubmissionRecords.mockResolvedValue([record('1')])
    const store = useSubmissionStore()

    await store.fetchRecords({ status: 'approved' })
    await store.fetchRecords()

    expect(mocks.getSubmissionRecords).toHaveBeenCalledTimes(2)
  })

  it('并发调用共享同一个在途请求', async () => {
    mocks.getSubmissionRecords.mockResolvedValue([record('1')])
    const store = useSubmissionStore()

    await Promise.all([store.fetchRecords(), store.fetchRecords()])

    expect(mocks.getSubmissionRecords).toHaveBeenCalledTimes(1)
  })

  it('接口失败置 loadError，保留已加载记录', async () => {
    mocks.getSubmissionRecords.mockResolvedValueOnce([record('1')])
    const store = useSubmissionStore()
    await store.fetchRecords()

    mocks.getSubmissionRecords.mockRejectedValueOnce(new Error('boom'))
    await store.fetchRecords(undefined, true)

    expect(store.loadError).toBe(true)
    expect(store.records).toHaveLength(1)
    expect(store.loading).toBe(false)
  })
})

describe('useSubmissionStore 撤回与删除', () => {
  it('撤回成功后写入当前用户命名空间标记并置为已撤回态', async () => {
    mocks.getSubmissionRecords.mockResolvedValue([record('1')])
    const store = useSubmissionStore()
    await store.fetchRecords()

    await store.withdrawRecord('1')

    expect(mocks.withdrawSubmission).toHaveBeenCalledWith('1', 'archive')
    expect(JSON.parse(localStorage.getItem(WITHDRAWN_KEY) ?? '[]')).toEqual(['1'])
    expect(store.records[0]).toMatchObject({ status: 'withdrawn', canEdit: false, canDelete: true })
  })

  it('重拉列表时按本地标记强制保持已撤回态（后端撤回后为草稿）', async () => {
    localStorage.setItem(WITHDRAWN_KEY, JSON.stringify(['2']))
    mocks.getSubmissionRecords.mockResolvedValue([record('2', { status: 'draft', canEdit: true })])
    const store = useSubmissionStore()

    await store.fetchRecords()

    expect(store.filteredRecords[0]).toMatchObject({
      status: 'withdrawn',
      canEdit: false,
      canDelete: true,
    })
  })

  it('删除记录后同步清理撤回标记', async () => {
    localStorage.setItem(WITHDRAWN_KEY, JSON.stringify(['2']))
    mocks.getSubmissionRecords.mockResolvedValue([record('2', { status: 'draft' })])
    const store = useSubmissionStore()
    await store.fetchRecords()

    await store.deleteSubmission('2')

    expect(mocks.deleteActivity).toHaveBeenCalledWith(2, 'archive')
    expect(store.records).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(WITHDRAWN_KEY) ?? '[]')).toEqual([])
  })

  it('reset 清空状态与本地撤回标记，下次全量重新请求', async () => {
    mocks.getSubmissionRecords.mockResolvedValue([record('1')])
    const store = useSubmissionStore()
    await store.fetchRecords()
    store.reset()

    expect(store.records).toEqual([])
    expect(store.filteredRecords).toEqual([])
    expect(localStorage.getItem(WITHDRAWN_KEY)).toBeNull()

    await store.fetchRecords()
    expect(mocks.getSubmissionRecords).toHaveBeenCalledTimes(2)
  })
})
