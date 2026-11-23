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
  /**
   * 最近一次加载是否失败（与「确实没有动态」区分）。
   * getActivities 失败时向上抛错，此处捕获并置位；已有数据保留，不做清空。
   */
  const loadFailed = ref(false)

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
        loadFailed.value = false
      } catch {
        // 错误提示由请求拦截器统一给出；保留旧数据，仅记录错误态供页面展示重试
        loadFailed.value = true
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

  /**
   * 重置用户级状态（登出/换账号时调用）。
   * 除清空 state 外，复位模块级请求缓存变量（pendingFetch / lastFetchedAt）：
   * 否则换账号后 60s TTL 内仍会命中上一账号的动态列表缓存。
   */
  function reset(): void {
    pendingFetch = null
    lastFetchedAt = 0
    activities.value = []
    filteredActivities.value = []
    loading.value = false
  }

  return {
    activities,
    filteredActivities,
    loading,
    loadFailed,
    fetchActivities,
    reset,
  }
})
