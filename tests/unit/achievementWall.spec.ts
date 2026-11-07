import type {
  AchievementDetail,
  AchievementListItem,
  AchievementListResult,
} from '@/shared/api/achievements'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CATEGORY_OPTIONS,
  categoryLabelOf,
  formatEventDate,
  formatEventMonth,
  PAGE_SIZE,
  PRACTICE_TAG_OPTIONS,
  useAchievementWall,
} from '@/features/achievements/composables/useAchievementWall'

const api = vi.hoisted(() => ({
  getAchievements: vi.fn(),
  getAchievementDetail: vi.fn(),
}))

vi.mock('@/shared/api/achievements', () => ({
  getAchievements: api.getAchievements,
  getAchievementDetail: api.getAchievementDetail,
}))

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function item(over: Partial<AchievementListItem> = {}): AchievementListItem {
  return {
    id: '1',
    title: '蓝桥杯',
    category: 'contest',
    categoryLabel: '',
    level: '国家级',
    issuer: '',
    eventAt: '2026-09-21',
    thumbnailUrl: null,
    fileCount: 1,
    materialStatus: 'archived',
    materialLabel: '已归档',
    sourceType: '',
    sourceId: 1,
    updatedAt: '',
    tags: [],
    version: 1,
    ...over,
  }
}

function listResult(over: Partial<AchievementListResult> = {}): AchievementListResult {
  return {
    list: [item()],
    counts: { all: 5, honor: 2, contest: 1, practice: 1, research: 0, completion: 1, other: 0 },
    statusCounts: { all: 5, archived: 2, missing: 1, pending: 2 },
    pagination: { page: 1, per_page: PAGE_SIZE, total: 5, total_pages: 1 },
    ...over,
  }
}

function detail(over: Partial<AchievementDetail> = {}): AchievementDetail {
  return {
    id: 'a1',
    title: '蓝桥杯',
    category: 'contest',
    categoryLabel: '竞赛',
    level: '',
    issuer: '',
    eventAt: '2026-09-21',
    description: '',
    semester: null,
    materialStatus: 'archived',
    materialLabel: '已归档',
    attachments: [],
    fields: [],
    audit: null,
    linked: null,
    updatedAt: '',
    tags: [],
    version: 1,
    ...over,
  }
}

beforeEach(() => {
  api.getAchievements.mockReset()
  api.getAchievementDetail.mockReset()
})

describe('常量与格式化', () => {
  it('页大小固定为 8，分类与二级标签顺序稳定', () => {
    expect(PAGE_SIZE).toBe(8)
    expect(CATEGORY_OPTIONS.map((o) => o.value)).toEqual([
      'all',
      'honor',
      'contest',
      'practice',
      'research',
      'completion',
    ])
    expect(PRACTICE_TAG_OPTIONS.map((o) => o.value)).toEqual([
      '',
      'volunteer',
      'activity',
      'internship',
      'social_practice',
    ])
  })

  it('formatEventMonth 截取年月，非法值返回空串', () => {
    expect(formatEventMonth('2026-09-21')).toBe('2026.09')
    expect(formatEventMonth('2026-09-21T10:00:00')).toBe('2026.09')
    expect(formatEventMonth(null)).toBe('')
    expect(formatEventMonth('2026')).toBe('')
  })

  it('formatEventDate 截取年月日，无法解析时原样返回', () => {
    expect(formatEventDate('2026-09-21T10:00:00')).toBe('2026.09.21')
    expect(formatEventDate(undefined)).toBe('')
    expect(formatEventDate('2026-09')).toBe('2026-09')
  })

  it('categoryLabelOf 后端文案优先，其次本地映射，未知分类为空串', () => {
    expect(categoryLabelOf({ category: 'honor', categoryLabel: '后端荣誉' })).toBe('后端荣誉')
    expect(categoryLabelOf({ category: 'honor', categoryLabel: '' })).toBe('荣誉')
    expect(categoryLabelOf({ category: 'other', categoryLabel: '' })).toBe('其他')
  })
})

describe('useAchievementWall 列表', () => {
  it('初始值为空态且未加载', () => {
    const wall = useAchievementWall()

    expect(wall.category.value).toBe('all')
    expect(wall.status.value).toBe('all')
    expect(wall.practiceTag.value).toBe('')
    expect(wall.items.value).toEqual([])
    expect(wall.hasLoaded.value).toBe(false)
    expect(wall.archivedCount.value).toBeNull()
    expect(wall.missingCount.value).toBeNull()
    expect(wall.totalCount.value).toBeNull()
    expect(wall.isEmpty.value).toBe(false)
  })

  it('refresh 拉取首屏并计算派生值', async () => {
    api.getAchievements.mockResolvedValue(
      listResult({
        list: [
          item({ id: '1', eventAt: '2026-09-21' }),
          item({ id: '2', eventAt: '2026-10-01' }),
          item({ id: '3', eventAt: '' }),
        ],
      }),
    )

    const wall = useAchievementWall()
    wall.refresh()
    await flush()

    expect(api.getAchievements).toHaveBeenCalledWith(
      {
        category: 'all',
        status: 'all',
        tag: undefined,
        sort: 'date_desc',
        page: 1,
        per_page: PAGE_SIZE,
      },
      expect.any(AbortSignal),
    )
    expect(wall.items.value).toHaveLength(3)
    expect(wall.hasLoaded.value).toBe(true)
    expect(wall.loading.value).toBe(false)
    expect(wall.archivedCount.value).toBe(2)
    expect(wall.missingCount.value).toBe(1)
    expect(wall.totalCount.value).toBe(5)
    expect(wall.categoryCount.value).toBe(4)
    expect(wall.latestEventAt.value).toBe('2026-10-01')
    expect(wall.hasMore.value).toBe(false)
    expect(wall.isEmpty.value).toBe(false)
  })

  it('空列表加载完成后进入空态', async () => {
    api.getAchievements.mockResolvedValue(
      listResult({
        list: [],
        pagination: { page: 1, per_page: PAGE_SIZE, total: 0, total_pages: 0 },
      }),
    )

    const wall = useAchievementWall()
    wall.refresh()
    await flush()

    expect(wall.isEmpty.value).toBe(true)
    expect(wall.hasMore.value).toBe(false)
  })

  it('还有下一页时 loadMore 追加数据，加载中重复调用被忽略', async () => {
    api.getAchievements
      .mockResolvedValueOnce(
        listResult({ pagination: { page: 1, per_page: PAGE_SIZE, total: 10, total_pages: 2 } }),
      )
      .mockResolvedValueOnce(listResult({ list: [item({ id: '2' })] }))

    const wall = useAchievementWall()
    wall.refresh()
    await flush()
    expect(wall.hasMore.value).toBe(true)

    wall.loadMore()
    wall.loadMore()
    await flush()

    expect(api.getAchievements).toHaveBeenCalledTimes(2)
    expect(api.getAchievements).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
      expect.any(AbortSignal),
    )
    expect(wall.items.value.map((i) => i.id)).toEqual(['1', '2'])
  })

  it('切分类时清除实践二级标签，并只在实践分类下传 tag', async () => {
    api.getAchievements.mockResolvedValue(listResult())

    const wall = useAchievementWall({ category: 'practice', practiceTag: 'volunteer' })
    wall.refresh()
    await flush()
    expect(api.getAchievements).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'practice', tag: 'volunteer' }),
      expect.any(AbortSignal),
    )

    wall.setCategory('honor')
    await flush()
    expect(wall.practiceTag.value).toBe('')
    expect(api.getAchievements).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'honor', tag: undefined }),
      expect.any(AbortSignal),
    )

    const calls = api.getAchievements.mock.calls.length
    wall.setCategory('honor')
    await flush()
    expect(api.getAchievements.mock.calls).toHaveLength(calls)
  })

  it('setPracticeTag / setStatus / applyFilters 只在值变化时发请求', async () => {
    api.getAchievements.mockResolvedValue(listResult())

    const wall = useAchievementWall({ category: 'practice' })
    wall.setPracticeTag('internship')
    await flush()
    expect(api.getAchievements).toHaveBeenLastCalledWith(
      expect.objectContaining({ tag: 'internship', page: 1 }),
      expect.any(AbortSignal),
    )

    wall.setStatus('missing')
    await flush()
    expect(wall.statusText.value).toBe('仅看缺材料')

    wall.clearStatus()
    await flush()
    expect(wall.status.value).toBe('all')
    expect(wall.statusText.value).toBe('')

    wall.setStatus('archived')
    wall.setStatus('pending')
    expect(wall.statusText.value).toBe('仅看审核中')

    const calls = api.getAchievements.mock.calls.length
    wall.applyFilters(wall.category.value, wall.status.value)
    expect(api.getAchievements.mock.calls).toHaveLength(calls)

    wall.applyFilters('honor', 'all')
    await flush()
    expect(api.getAchievements).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'honor', status: 'all' }),
      expect.any(AbortSignal),
    )
  })

  it('切换分类期间阻止翻页，旧卡片保持到新数据到达', async () => {
    let resolveSecond: (value: AchievementListResult) => void = () => {}
    api.getAchievements
      .mockResolvedValueOnce(
        listResult({ pagination: { page: 1, per_page: PAGE_SIZE, total: 10, total_pages: 2 } }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<AchievementListResult>((resolve) => {
            resolveSecond = resolve
          }),
      )

    const wall = useAchievementWall()
    wall.refresh()
    await flush()
    expect(wall.hasMore.value).toBe(true)

    wall.setCategory('honor')
    const calls = api.getAchievements.mock.calls.length
    wall.loadMore()
    expect(api.getAchievements.mock.calls).toHaveLength(calls)
    // 新数据到达前旧卡片保持可见，避免「清空 → 骨架 → 内容」三段闪
    expect(wall.items.value.map((i) => i.id)).toEqual(['1'])

    resolveSecond(listResult({ list: [item({ id: '9' })] }))
    await flush()
    expect(wall.items.value.map((i) => i.id)).toEqual(['9'])
  })

  it('首屏失败进入错误态，翻页失败标记为 more', async () => {
    api.getAchievements.mockRejectedValueOnce(new Error('boom'))

    const wall = useAchievementWall()
    wall.refresh()
    await flush()

    expect(wall.error.value).toBe(true)
    expect(wall.errorMode.value).toBe('reset')
    expect(wall.loading.value).toBe(false)

    api.getAchievements
      .mockResolvedValueOnce(
        listResult({ pagination: { page: 1, per_page: PAGE_SIZE, total: 10, total_pages: 2 } }),
      )
      .mockRejectedValueOnce(new Error('boom'))

    wall.refresh()
    await flush()
    wall.loadMore()
    await flush()

    expect(wall.error.value).toBe(true)
    expect(wall.errorMode.value).toBe('more')
    expect(wall.loadingMore.value).toBe(false)
  })

  it('主动取消的请求不进入错误态', async () => {
    api.getAchievements.mockRejectedValue({ code: 'ERR_CANCELED' })

    const wall = useAchievementWall()
    wall.refresh()
    await flush()

    expect(wall.error.value).toBe(false)
    expect(wall.errorMode.value).toBeNull()
    expect(wall.loading.value).toBe(false)
  })

  it('dispose 会中断进行中的列表请求', async () => {
    let signal: AbortSignal | undefined
    api.getAchievements.mockImplementation((_params, s: AbortSignal) => {
      signal = s
      return new Promise(() => {})
    })

    const wall = useAchievementWall()
    wall.refresh()
    wall.dispose()

    expect(signal?.aborted).toBe(true)
  })
})

describe('useAchievementWall 详情', () => {
  it('打开详情后填充数据，同一 id 不重复请求', async () => {
    api.getAchievementDetail.mockResolvedValue(detail())

    const wall = useAchievementWall()
    wall.openDetail('a1')
    await flush()

    expect(wall.detailId.value).toBe('a1')
    expect(wall.detail.value?.id).toBe('a1')
    expect(wall.detailLoading.value).toBe(false)
    expect(wall.detailError.value).toBe(false)

    wall.openDetail('a1')
    await flush()
    expect(api.getAchievementDetail).toHaveBeenCalledTimes(1)
  })

  it('详情 404 时关闭并提示，detailError 保持 false', async () => {
    api.getAchievementDetail.mockRejectedValue({ response: { status: 404 } })

    const wall = useAchievementWall()
    wall.openDetail('a1')
    await flush()

    expect(wall.detailId.value).toBeNull()
    expect(wall.detail.value).toBeNull()
    expect(wall.detailError.value).toBe(false)
    expect(wall.notice.value).toBe('成果不存在或已删除')
    wall.dispose()
  })

  it('详情失败可重试，重试成功后清除错误', async () => {
    api.getAchievementDetail
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(detail({ title: '重试成功' }))

    const wall = useAchievementWall()
    wall.openDetail('a1')
    await flush()
    expect(wall.detailError.value).toBe(true)
    expect(wall.detailId.value).toBe('a1')

    wall.retryDetail()
    await flush()
    expect(wall.detailError.value).toBe(false)
    expect(wall.detail.value?.title).toBe('重试成功')
  })

  it('closeDetail 重置详情状态并中断请求', async () => {
    let signal: AbortSignal | undefined
    api.getAchievementDetail.mockImplementation((_id, s: AbortSignal) => {
      signal = s
      return new Promise(() => {})
    })

    const wall = useAchievementWall()
    wall.openDetail('a1')
    wall.closeDetail()

    expect(signal?.aborted).toBe(true)
    expect(wall.detailId.value).toBeNull()
    expect(wall.detail.value).toBeNull()
    expect(wall.detailLoading.value).toBe(false)
  })

  it('setNotice 提示 4 秒后自动清除', () => {
    vi.useFakeTimers()
    try {
      const wall = useAchievementWall()
      wall.setNotice('已复制')
      expect(wall.notice.value).toBe('已复制')

      vi.advanceTimersByTime(3999)
      expect(wall.notice.value).toBe('已复制')

      vi.advanceTimersByTime(1)
      expect(wall.notice.value).toBe('')
    } finally {
      vi.useRealTimers()
    }
  })
})
