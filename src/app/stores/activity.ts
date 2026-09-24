import type { Activity, ActivityFilters } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getActivities } from '@/shared/api/activity'

/**
 * 最近动态 Store
 * 数据来源：activityApi（后端就绪后只需改 API 层）
 */
export const useActivityStore = defineStore('activity', () => {
  const activities = ref<Activity[]>([])
  const filteredActivities = ref<Activity[]>([])
  const loading = ref(false)

  let pendingFetch: Promise<void> | null = null
  let lastFetchedAt = 0
  const CACHE_TTL_MS = 60_000

  async function fetchActivities(filters?: ActivityFilters, force = false): Promise<void> {
    if (pendingFetch) return pendingFetch
    if (
      !force &&
      !filters &&
      Date.now() - lastFetchedAt < CACHE_TTL_MS &&
      activities.value.length > 0
    ) {
      filteredActivities.value = activities.value
      return
    }
    loading.value = true
    pendingFetch = (async () => {
      try {
        if (!filters && activities.value.length === 0) {
          activities.value = await getActivities()
          lastFetchedAt = Date.now()
        }
        filteredActivities.value = filters ? await getActivities(filters) : activities.value
      } finally {
        loading.value = false
      }
    })()
    try {
      await pendingFetch
    } finally {
      pendingFetch = null
    }
  }

  // 编辑 / 删除动态：本 Store 的 Activity 视图模型不含记录真实类别（archive/award/...），
  // 无法推导出 activities.ts 所需的 type 路径变量；此前由 shared/api/activity.ts 用
  // 固定 `?type=archive` 兜底，路径形态错误必然 404 且被 catch 吞掉。
  // 该类操作请直接调用 @/shared/api/activities 的 updateActivity / deleteActivity（按记录类别传 type），
  // 例如 app/stores/submission.ts:131 的写法。

  return {
    activities,
    filteredActivities,
    loading,
    fetchActivities,
  }
})
