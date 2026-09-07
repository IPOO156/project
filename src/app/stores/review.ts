import type { ReviewFilters } from '@/shared/api/review'
import type { ReviewRecord } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { updateActivity } from '@/shared/api/activities'
import { getActivities } from '@/shared/api/activity'

/**
 * 申报审核 Store
 * 管理 10 个申报类型的审核记录查询与重新提交
 * 数据来源：GET /activities（动态记录，6.1）
 */
export const useReviewStore = defineStore('review', () => {
  const allRecords = ref<ReviewRecord[]>([])
  const typeRecords = ref<Record<string, ReviewRecord[]>>({})
  const loading = ref(false)

  let pendingFetch: Promise<ReviewRecord[]> | null = null
  let lastFullFetchAt = 0
  const CACHE_TTL_MS = 60_000
  const pendingByType = new Map<string, Promise<ReviewRecord[]>>()

  /** 加载全部审核记录（对接 GET /activities，接口异常回退 Mock） */
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
        const mapped = activities.map((a: any) => ({
          id: a.id,
          type: a.type || '',
          typeLabel: a.typeLabel || '',
          title: a.text || a.title || '',
          submitDate: a.time || '',
          semester: a.semester || '',
          status: a.status || 'pending',
          proofMaterials: [],
        }))
        allRecords.value = mapped
        if (!isFiltered) lastFullFetchAt = Date.now()
        if (filters)
          return allRecords.value.filter(
            (r) => !filters.keyword || r.title.includes(filters.keyword),
          )
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
        return activities
          .filter((a: any) => a.type === type)
          .map((a: any) => ({
            id: a.id,
            type: a.type || '',
            typeLabel: a.typeLabel || '',
            title: a.text || a.title || '',
            submitDate: a.time || '',
            semester: a.semester || '',
            status: a.status || 'pending',
            proofMaterials: [],
          }))
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

  /** 重新提交审核记录（对接 PUT /activities/{id}，6.3） */
  async function resubmit(id: string, data: Record<string, any>): Promise<void> {
    try {
      await updateActivity(Number(id), 'archive', data)
    } catch {
      /* 接口失败时本地更新 */
    }

    const status = 'pending'
    const allIdx = allRecords.value.findIndex((r) => r.id === id)
    if (allIdx >= 0) allRecords.value[allIdx] = { ...allRecords.value[allIdx], ...data, status }
    const type = (data.type || allRecords.value[allIdx]?.type) as string
    if (type && typeRecords.value[type]) {
      const tIdx = typeRecords.value[type].findIndex((r) => r.id === id)
      if (tIdx >= 0)
        typeRecords.value[type][tIdx] = { ...typeRecords.value[type][tIdx], ...data, status }
    }

    ElMessage.success('修改已保存，等待重新审核')
  }

  return { allRecords, typeRecords, loading, fetchAll, fetchByType, resubmit }
})
