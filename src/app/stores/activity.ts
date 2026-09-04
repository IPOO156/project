import type { Activity, ActivityFilters } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  deleteActivity as apiDelete,
  updateActivity as apiUpdate,
  getActivities,
} from '@/shared/api/activity'

/**
 * 最近动态 Store
 * 数据来源：activityApi（后端就绪后只需改 API 层）
 */
export const useActivityStore = defineStore('activity', () => {
  const activities = ref<Activity[]>([])
  const filteredActivities = ref<Activity[]>([])
  const loading = ref(false)

  async function fetchActivities(filters?: ActivityFilters): Promise<void> {
    loading.value = true
    try {
      // 全量数据（用于计数），首次加载后缓存
      if (activities.value.length === 0) {
        activities.value = await getActivities()
      }
      // 筛选数据
      filteredActivities.value = filters ? await getActivities(filters) : activities.value
    } finally {
      loading.value = false
    }
  }

  async function updateActivity(id: string, payload: Partial<Omit<Activity, 'id'>>): Promise<void> {
    const target = activities.value.find((i) => i.id === id)
    if (!target) return

    if (target.status === 'approved') {
      ElMessage.warning('已通过审核的记录不可修改')
      return
    }

    await apiUpdate(id, payload)
    const idx = activities.value.findIndex((i) => i.id === id)
    if (idx >= 0) {
      activities.value[idx] = { ...target, ...payload }
    }
    const fIdx = filteredActivities.value.findIndex((i) => i.id === id)
    if (fIdx >= 0) {
      filteredActivities.value[fIdx] = { ...filteredActivities.value[fIdx], ...payload }
    }
    ElMessage.success('动态已更新')
  }

  async function deleteActivity(id: string): Promise<void> {
    const target = activities.value.find((i) => i.id === id)
    if (!target) return

    if (target.status === 'approved') {
      ElMessage.warning('已通过审核的记录不可删除')
      return
    }

    await apiDelete(id)
    activities.value = activities.value.filter((i) => i.id !== id)
    filteredActivities.value = filteredActivities.value.filter((i) => i.id !== id)
    ElMessage.success('动态已删除')
  }

  return {
    activities,
    filteredActivities,
    loading,
    fetchActivities,
    updateActivity,
    deleteActivity,
  }
})
