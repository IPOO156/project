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

  async function fetchDashboard(): Promise<void> {
    loading.value = true
    try {
      data.value = await getHomeDashboard()
    } catch {
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, fetchDashboard }
})
