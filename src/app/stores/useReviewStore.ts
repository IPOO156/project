import type { ReviewFilters } from '@/shared/api/review'
import type { ReviewRecord } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getActivities } from '@/shared/api/activity'
import { applyResubmitted, mapActivityBase, resubmitActivity } from './reviewRecordShared'

/**
 * 申报审核 Store
 * 管理 10 个申报类型的审核记录查询与重新提交
 * 数据来源：GET /activities（动态记录，6.1）
 */
export const useReviewStore = defineStore('review', () => {
  const allRecords = ref<ReviewRecord[]>([])
  const typeRecords = ref<Record<string, ReviewRecord[]>>({})
  const loading = ref(false)
  /** 最近一次动态加载是否失败（与「确实没有记录」区分；已有数据保留） */
  const loadFailed = ref(false)

  let pendingFetch: Promise<ReviewRecord[]> | null = null
  let lastFullFetchAt = 0
  const CACHE_TTL_MS = 60_000
  const pendingByType = new Map<string, Promise<ReviewRecord[]>>()

  /**
   * 加载全部审核记录（对接 GET /activities）。
   * 接口异常时错误由请求拦截器提示，此处记录 loadFailed 并保留已有列表，
   * 不清空成「看起来没有记录」的空态。
   */
  async function fetchAll(filters?: ReviewFilters, force = false): Promise<ReviewRecord[]> {
    if (pendingFetch) return pendingFetch
    const isFiltered = !!(filters?.keyword || filters?.status)
    if (
      !force &&
      !isFiltered &&
      Date.now() - lastFullFetchAt < CACHE_TTL_MS &&
      allRecords.value.length > 0
    ) {
      return allRecords.value
    }
    loading.value = true
    pendingFetch = (async () => {
      try {
        const params: Record<string, any> = {}
        if (filters?.keyword) params.keyword = filters.keyword
        if (filters?.status) params.status = Number(filters.status)
        const activities = await getActivities(params)
        const mapped = activities.map((a) => ({
          ...mapActivityBase(a),
          proofMaterials: [],
        }))
        allRecords.value = mapped
        loadFailed.value = false
        if (!isFiltered) lastFullFetchAt = Date.now()
        if (filters) {
          return allRecords.value.filter(
            (r) => !filters.keyword || r.title.includes(filters.keyword),
          )
        }
        return allRecords.value
      } catch {
        // 错误提示由请求拦截器统一给出；保留已有列表，仅记录错误态
        loadFailed.value = true
        return allRecords.value
      } finally {
        loading.value = false
      }
    })()
    try {
      return await pendingFetch
    } finally {
      pendingFetch = null
    }
  }

  /** 按类型加载审核记录（对接 /activities，按类型过滤） */
  async function fetchByType(
    type: string,
    _filters?: Record<string, any>,
  ): Promise<ReviewRecord[]> {
    // 同一个 type 已经在飞了，共享同一个 Promise
    const existing = pendingByType.get(type)
    if (existing) return existing

    loading.value = true
    const task = (async () => {
      try {
        const activities = await getActivities()
        loadFailed.value = false
        return activities
          .filter((a) => a.type === type)
          .map((a) => ({
            ...mapActivityBase(a),
            proofMaterials: [],
          }))
      } catch {
        // 错误提示由请求拦截器统一给出；保留该类型已有记录
        loadFailed.value = true
        return typeRecords.value[type] ?? []
      } finally {
        loading.value = false
      }
    })()
    pendingByType.set(type, task)
    try {
      const records = await task
      typeRecords.value = { ...typeRecords.value, [type]: records }
      return records
    } finally {
      pendingByType.delete(type)
    }
  }

  /**
   * 重新提交审核记录（对接 PUT /activities/{id}，6.3）。
   *  接口失败时错误向上抛出（拦截器已统一提示），禁止本地伪造 pending 状态与假成功提示
   */
  async function resubmit(id: string, data: Record<string, any>): Promise<void> {
    await resubmitActivity(id, 'archive', data)

    applyResubmitted(allRecords.value, id, data)
    const type = (data.type || allRecords.value.find((r) => r.id === id)?.type) as string
    if (type && typeRecords.value[type]) applyResubmitted(typeRecords.value[type], id, data)
  }

  /**
   * 重置用户级状态（登出/换账号时调用）。
   * 除清空 state 外，复位模块级请求缓存变量（pendingFetch / lastFullFetchAt / pendingByType）：
   * 否则换账号后 60s TTL 内仍会命中上一账号的审核记录缓存。
   */
  function reset(): void {
    pendingFetch = null
    lastFullFetchAt = 0
    pendingByType.clear()
    allRecords.value = []
    typeRecords.value = {}
    loading.value = false
    loadFailed.value = false
  }

  return { allRecords, typeRecords, loading, loadFailed, fetchAll, fetchByType, resubmit, reset }
})
