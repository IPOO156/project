import type {
  AchievementCategory,
  AchievementCounts,
  AchievementDetail,
  AchievementListItem,
  AchievementMaterialStatus,
  AchievementPagination,
  AchievementPracticeTag,
  AchievementStatusCounts,
} from '@/shared/api/achievements'
import { computed, ref } from 'vue'
import { getAchievementDetail, getAchievements } from '@/shared/api/achievements'

/**
 * 每页条数：页面网格与骨架屏共用同一值，避免加载完成前后布局跳动。
 * 实测 1440×900 下 4×3（12 张）会让内容区溢出 18px 出现滚动条，
 * 按约定降为 4×2（8 张），不压缩卡片高度。
 */
export const PAGE_SIZE = 8

export const CATEGORY_LABELS: Record<Exclude<AchievementCategory, 'all'>, string> = {
  honor: '荣誉',
  contest: '竞赛',
  practice: '实践',
  research: '科研',
  completion: '结课',
  other: '其他',
}

/** chip 顺序只追加、不重排：结课排在科研之后，「其他」仍由 counts 驱动 */
export const CATEGORY_OPTIONS: Array<{ value: AchievementCategory; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'honor', label: '荣誉' },
  { value: 'contest', label: '竞赛' },
  { value: 'practice', label: '实践' },
  { value: 'research', label: '科研' },
  { value: 'completion', label: '结课' },
]

/** 实践二级标签：值 '' 表示不做二级筛选 */
export const PRACTICE_TAG_OPTIONS: Array<{ value: AchievementPracticeTag | ''; label: string }> = [
  { value: '', label: '全部实践' },
  { value: 'volunteer', label: '志愿' },
  { value: 'activity', label: '活动' },
  { value: 'internship', label: '实习' },
  { value: 'social_practice', label: '社会实践' },
]

/** 2026-09-21 / ISO → 2026.09 */
export function formatEventMonth(value: string | null | undefined): string {
  if (!value) return ''
  const [year, month] = value.slice(0, 10).split('-')
  return year && month ? `${year}.${month}` : ''
}

/** 2026-09-21 / ISO → 2026.09.21 */
export function formatEventDate(value: string | null | undefined): string {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${year}.${month}.${day}` : value
}

export function categoryLabelOf(
  item: Pick<AchievementListItem, 'category' | 'categoryLabel'>,
): string {
  return item.categoryLabel || CATEGORY_LABELS[item.category] || ''
}

function isCanceled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'ERR_CANCELED'
  )
}

function httpStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status
}

export function useAchievementWall(
  initial: {
    category?: AchievementCategory
    status?: AchievementMaterialStatus
    practiceTag?: AchievementPracticeTag | ''
  } = {},
) {
  const category = ref<AchievementCategory>(initial.category ?? 'all')
  const status = ref<AchievementMaterialStatus>(initial.status ?? 'all')
  const practiceTag = ref<AchievementPracticeTag | ''>(initial.practiceTag ?? '')

  const items = ref<AchievementListItem[]>([])
  const counts = ref<AchievementCounts | null>(null)
  const statusCounts = ref<AchievementStatusCounts | null>(null)
  const pagination = ref<AchievementPagination | null>(null)

  const loading = ref(false)
  const loadingMore = ref(false)
  // 切分类时保留旧卡片的过渡态：loading 只驱动首次进入的骨架，切换期间旧卡保持可见
  const switching = ref(false)
  const error = ref(false)
  /** 失败来源：翻页失败只降级为一条提示，其余失败（首载/切筛选）走整块错误态或可重试提示 */
  const errorMode = ref<'reset' | 'more' | null>(null)
  const hasLoaded = ref(false)
  const page = ref(1)

  let listController: AbortController | null = null
  let listSeq = 0

  const hasMore = computed(
    () => !!pagination.value && pagination.value.page < pagination.value.total_pages,
  )
  const isEmpty = computed(
    () => hasLoaded.value && !error.value && !loading.value && items.value.length === 0,
  )
  const archivedCount = computed(() => statusCounts.value?.archived ?? null)
  const missingCount = computed(() => statusCounts.value?.missing ?? null)
  const totalCount = computed(() => counts.value?.all ?? pagination.value?.total ?? null)
  const categoryCount = computed(() => {
    const snapshot = counts.value
    if (!snapshot) return null
    return (Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).filter(
      (key) => snapshot[key] > 0,
    ).length
  })
  const latestEventAt = computed(() =>
    items.value.reduce((latest, item) => (item.eventAt > latest ? item.eventAt : latest), ''),
  )
  const statusText = computed(() => {
    if (status.value === 'missing') return '仅看缺材料'
    if (status.value === 'pending') return '仅看审核中'
    if (status.value === 'archived') return '仅看已归档'
    return ''
  })

  async function requestList(nextPage: number, mode: 'reset' | 'more', keepItems = false) {
    listController?.abort()
    const controller = new AbortController()
    listController = controller
    const seq = ++listSeq

    if (mode === 'reset') {
      error.value = false
      errorMode.value = null
      if (keepItems && items.value.length > 0) {
        // 旧卡留到新数据到达再整体替换，避免「清空 → 骨架 → 内容」三段闪
        switching.value = true
      } else {
        loading.value = true
        items.value = []
      }
    } else {
      loadingMore.value = true
    }

    try {
      const data = await getAchievements(
        {
          category: category.value,
          status: status.value,
          tag: category.value === 'practice' && practiceTag.value ? practiceTag.value : undefined,
          sort: 'date_desc',
          page: nextPage,
          per_page: PAGE_SIZE,
        },
        controller.signal,
      )
      if (seq !== listSeq) return

      items.value = mode === 'reset' ? (data.list ?? []) : [...items.value, ...(data.list ?? [])]
      counts.value = data.counts ?? null
      statusCounts.value = data.statusCounts ?? null
      pagination.value = data.pagination ?? null
      page.value = nextPage
      hasLoaded.value = true
      error.value = false
      errorMode.value = null
    } catch (err) {
      if (seq !== listSeq || isCanceled(err)) return
      error.value = true
      errorMode.value = mode
    } finally {
      if (seq === listSeq) {
        loading.value = false
        loadingMore.value = false
        switching.value = false
      }
    }
  }

  function setCategory(next: AchievementCategory) {
    if (category.value === next) return
    category.value = next
    if (next !== 'practice') practiceTag.value = ''
    void requestList(1, 'reset', true)
  }

  function setPracticeTag(next: AchievementPracticeTag | '') {
    if (practiceTag.value === next) return
    practiceTag.value = next
    void requestList(1, 'reset', true)
  }

  function setStatus(next: AchievementMaterialStatus) {
    if (status.value === next) return
    status.value = next
    void requestList(1, 'reset', true)
  }

  function clearStatus() {
    setStatus('all')
  }

  function applyFilters(nextCategory: AchievementCategory, nextStatus: AchievementMaterialStatus) {
    if (category.value === nextCategory && status.value === nextStatus) return
    category.value = nextCategory
    status.value = nextStatus
    void requestList(1, 'reset', true)
  }

  function refresh() {
    void requestList(1, 'reset')
  }

  function loadMore() {
    if (!hasMore.value || loading.value || loadingMore.value || switching.value) return
    void requestList(page.value + 1, 'more')
  }

  /* ---------------- 详情 / 灯箱 ---------------- */

  const detail = ref<AchievementDetail | null>(null)
  const detailId = ref<string | null>(null)
  const detailLoading = ref(false)
  const detailError = ref(false)
  const notice = ref('')

  let detailController: AbortController | null = null
  let detailSeq = 0
  let noticeTimer: ReturnType<typeof setTimeout> | null = null

  function setNotice(message: string) {
    notice.value = message
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => {
      notice.value = ''
      noticeTimer = null
    }, 4000)
  }

  async function requestDetail(id: string) {
    detailController?.abort()
    const controller = new AbortController()
    detailController = controller
    const seq = ++detailSeq

    detailLoading.value = true
    detailError.value = false

    try {
      const data = await getAchievementDetail(id, controller.signal)
      if (seq !== detailSeq) return
      detail.value = data
    } catch (err) {
      if (seq !== detailSeq || isCanceled(err)) return
      if (httpStatus(err) === 404) {
        closeDetail()
        setNotice('成果不存在或已删除')
        return
      }
      detailError.value = true
    } finally {
      if (seq === detailSeq) detailLoading.value = false
    }
  }

  function openDetail(id: string) {
    if (detailId.value === id && detail.value) return
    detailId.value = id
    detail.value = null
    detailError.value = false
    void requestDetail(id)
  }

  function retryDetail() {
    if (detailId.value) void requestDetail(detailId.value)
  }

  function closeDetail() {
    detailController?.abort()
    detailController = null
    detailSeq += 1
    detailId.value = null
    detail.value = null
    detailError.value = false
    detailLoading.value = false
  }

  function dispose() {
    listController?.abort()
    detailController?.abort()
    if (noticeTimer) clearTimeout(noticeTimer)
  }

  return {
    category,
    status,
    practiceTag,
    items,
    counts,
    statusCounts,
    pagination,
    loading,
    loadingMore,
    error,
    errorMode,
    hasLoaded,
    hasMore,
    isEmpty,
    archivedCount,
    missingCount,
    totalCount,
    categoryCount,
    latestEventAt,
    statusText,
    setCategory,
    setPracticeTag,
    setStatus,
    clearStatus,
    applyFilters,
    refresh,
    loadMore,
    detail,
    detailId,
    detailLoading,
    detailError,
    notice,
    openDetail,
    retryDetail,
    closeDetail,
    setNotice,
    dispose,
  }
}
