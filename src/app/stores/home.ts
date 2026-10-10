import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getHomeDashboard } from '@/shared/api/student'

/**
 * 首页 Store
 * 对接后端 GET /home/dashboard（3.1），接口异常时保留空态（由各页面回退本地数据）。
 */
export const useHomeStore = defineStore('home', () => {
  const data = ref<any>(null)
  const loading = ref(false)

  let pendingFetch: Promise<void> | null = null
  let lastFetchedAt = 0
  const CACHE_TTL_MS = 60_000

  async function fetchDashboard(force = false): Promise<void> {
    if (pendingFetch) return pendingFetch
    if (!force && Date.now() - lastFetchedAt < CACHE_TTL_MS && data.value) return
    loading.value = true
    pendingFetch = (async () => {
      try {
        data.value = await getHomeDashboard()
        lastFetchedAt = Date.now()
      } catch {
        data.value = null
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

  return { data, loading, fetchDashboard }
})
