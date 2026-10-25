import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getActivities: vi.fn(),
  updateActivity: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/shared/api/activity', () => ({ getActivities: mocks.getActivities }))
vi.mock('@/shared/api/activities', () => ({ updateActivity: mocks.updateActivity }))
vi.mock('element-plus', () => ({ ElMessage: { success: mocks.success } }))

const { useReviewStore } = await import('@/app/stores/useReviewStore')
const { useAwardReviewStore } = await import('@/app/stores/useAwardReviewStore')
const { RESUBMIT_SUCCESS_MESSAGE } = await import('@/app/stores/reviewRecordShared')

/** 后端 /activities 的原始记录（字段名与前端模型不同） */
function activity(overrides: Record<string, any> = {}) {
  return {
    id: 9001,
    type: 'competition',
    typeLabel: '学科竞赛',
    text: '蓝桥杯',
    time: '2026-10-20',
    semester: '2026-2027-1',
    status: 'approved',
    ...overrides,
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mocks.getActivities.mockReset()
  mocks.updateActivity.mockReset().mockResolvedValue(undefined)
  mocks.success.mockReset()
})

describe('useReviewStore', () => {
  it('把动态记录映射为审核记录，id 统一为字符串', async () => {
    mocks.getActivities.mockResolvedValue([activity()])
    const store = useReviewStore()

    const records = await store.fetchAll()

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      id: '9001',
      type: 'competition',
      typeLabel: '学科竞赛',
      title: '蓝桥杯',
      submitDate: '2026-10-20',
      semester: '2026-2027-1',
      status: 'approved',
      proofMaterials: [],
    })
  })

  it('未命中筛选时 60s 内复用缓存，不重复请求', async () => {
    mocks.getActivities.mockResolvedValue([activity()])
    const store = useReviewStore()

    await store.fetchAll()
    await store.fetchAll()

    expect(mocks.getActivities).toHaveBeenCalledTimes(1)
  })

  it('带关键字时按标题本地过滤，且不写入全量缓存时间', async () => {
    mocks.getActivities.mockResolvedValue([
      activity({ id: 1, text: '蓝桥杯' }),
      activity({ id: 2, text: '数学建模' }),
    ])
    const store = useReviewStore()

    const filtered = await store.fetchAll({ keyword: '蓝桥' } as any)
    expect(filtered.map((r) => r.id)).toEqual(['1'])

    // 关键字请求不算全量拉取，下一次全量仍会回源
    await store.fetchAll()
    expect(mocks.getActivities).toHaveBeenCalledTimes(2)
  })

  it('接口失败时置 loadFailed 并保留已有列表', async () => {
    mocks.getActivities.mockResolvedValueOnce([activity()])
    const store = useReviewStore()
    await store.fetchAll()

    mocks.getActivities.mockRejectedValueOnce(new Error('boom'))
    const records = await store.fetchAll(undefined, true)

    expect(store.loadFailed).toBe(true)
    expect(records).toHaveLength(1)
  })

  it('fetchByType 按类型过滤，并发调用共享同一个请求', async () => {
    mocks.getActivities.mockResolvedValue([
      activity({ id: 1, type: 'competition' }),
      activity({ id: 2, type: 'paper' }),
    ])
    const store = useReviewStore()

    const [a, b] = await Promise.all([
      store.fetchByType('competition'),
      store.fetchByType('competition'),
    ])

    expect(a.map((r) => r.id)).toEqual(['1'])
    expect(b).toEqual(a)
    expect(mocks.getActivities).toHaveBeenCalledTimes(1)
    expect(store.typeRecords.competition).toHaveLength(1)
  })

  it('重新提交后状态回到 pending，并给出统一成功提示', async () => {
    mocks.getActivities.mockResolvedValue([activity()])
    const store = useReviewStore()
    await store.fetchAll()

    await store.resubmit('9001', { text: '补充材料' })

    expect(mocks.updateActivity).toHaveBeenCalledWith(9001, 'archive', { text: '补充材料' })
    expect(store.allRecords[0].status).toBe('pending')
    expect(store.allRecords[0].title).toBe('蓝桥杯')
    expect(mocks.success).toHaveBeenCalledWith(RESUBMIT_SUCCESS_MESSAGE)
  })

  it('reset 清空数据与缓存，下次全量会重新请求', async () => {
    mocks.getActivities.mockResolvedValue([activity()])
    const store = useReviewStore()
    await store.fetchAll()

    store.reset()
    expect(store.allRecords).toEqual([])
    expect(store.typeRecords).toEqual({})
    expect(store.loadFailed).toBe(false)

    await store.fetchAll()
    expect(mocks.getActivities).toHaveBeenCalledTimes(2)
  })
})

describe('useAwardReviewStore', () => {
  const AWARD_TYPES = [
    'award',
    'competitionStar',
    'innovationStar',
    'scientificProject',
    'softwareCopyright',
    'paper',
  ]

  it('只保留奖项类动态记录', async () => {
    mocks.getActivities.mockResolvedValue([
      activity({ id: 1, type: 'award' }),
      activity({ id: 2, type: 'competitionStar' }),
      activity({ id: 3, type: 'competition' }),
    ])
    const store = useAwardReviewStore()

    await store.fetchAll()

    expect(store.allRecords.map((r) => r.id)).toEqual(['1', '2'])
    expect(AWARD_TYPES).toContain(store.allRecords[0].type)
    expect(store.loadFailed).toBe(false)
  })

  it('接口失败时置 loadFailed 且不抛出', async () => {
    mocks.getActivities.mockRejectedValue(new Error('boom'))
    const store = useAwardReviewStore()

    await expect(store.fetchAll()).resolves.toBeUndefined()
    expect(store.loadFailed).toBe(true)
    expect(store.loading).toBe(false)
  })

  it('重新提交走 award 作用域并更新状态', async () => {
    mocks.getActivities.mockResolvedValue([activity({ id: 7, type: 'award' })])
    const store = useAwardReviewStore()
    await store.fetchAll()

    await store.resubmit('7', { remark: '补充' })

    expect(mocks.updateActivity).toHaveBeenCalledWith(7, 'award', { remark: '补充' })
    expect(store.allRecords[0].status).toBe('pending')
    expect(mocks.success).toHaveBeenCalledWith(RESUBMIT_SUCCESS_MESSAGE)
  })

  it('reset 清空列表与错误态', async () => {
    mocks.getActivities.mockRejectedValue(new Error('boom'))
    const store = useAwardReviewStore()
    await store.fetchAll()

    store.reset()

    expect(store.allRecords).toEqual([])
    expect(store.loadFailed).toBe(false)
    expect(store.loading).toBe(false)
  })
})
