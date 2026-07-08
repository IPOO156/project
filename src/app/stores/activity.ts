import type { Activity, ActivityFilters } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 最近动态 Store
 * 动态记录由申报/审批行为自动生成，支持筛选/搜索/分页、编辑、删除。
 * 已通过审核（approved）的记录禁止编辑与删除。
 */
export const useActivityStore = defineStore('activity', () => {
  const activities = ref<Activity[]>([])
  const filteredActivities = ref<Activity[]>([])
  const loading = ref(false)

  function generateMockData(): Activity[] {
    const rows: Activity[] = [
      {
        id: '1',
        type: 'submitted',
        text: '学科竞赛申报已提交',
        time: '2026-06-28 14:30',
        status: 'submitted',
      },
      {
        id: '2',
        type: 'approved',
        text: '社会实践申报已通过',
        time: '2026-06-25 10:20',
        status: 'approved',
      },
      {
        id: '3',
        type: 'submitted',
        text: '奖学金申请已提交',
        time: '2026-06-20 16:45',
        status: 'submitted',
      },
      {
        id: '4',
        type: 'rejected',
        text: '创新创业申报需修改',
        time: '2026-06-18 09:00',
        status: 'rejected',
      },
      {
        id: '5',
        type: 'approved',
        text: '荣誉证书登记已通过',
        time: '2026-06-15 11:30',
        status: 'approved',
      },
      {
        id: '6',
        type: 'submitted',
        text: '实习经历申请已提交',
        time: '2026-06-12 17:00',
        status: 'submitted',
      },
      {
        id: '7',
        type: 'approved',
        text: '图书心得登记已通过',
        time: '2026-06-10 09:30',
        status: 'approved',
      },
      {
        id: '8',
        type: 'rejected',
        text: '组织履历信息被驳回',
        time: '2026-06-08 14:00',
        status: 'rejected',
      },
      {
        id: '9',
        type: 'submitted',
        text: '科研项目申报已提交',
        time: '2026-06-05 11:15',
        status: 'submitted',
      },
      {
        id: '10',
        type: 'approved',
        text: '双创之星报名已通过',
        time: '2026-06-01 10:00',
        status: 'approved',
      },
      {
        id: '11',
        type: 'submitted',
        text: '竞赛之星报名已提交',
        time: '2026-05-25 13:40',
        status: 'submitted',
      },
      {
        id: '13',
        type: 'approved',
        text: '实训项目登记已通过',
        time: '2026-05-20 09:10',
        status: 'approved',
      },
      {
        id: '14',
        type: 'rejected',
        text: '荣誉证书照片不清晰被驳回',
        time: '2026-05-18 15:50',
        status: 'rejected',
      },
    ]
    return rows.sort((a, b) => b.time.localeCompare(a.time))
  }

  function applyFilters(filters?: ActivityFilters) {
    let result = [...activities.value]
    if (filters) {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase()
        result = result.filter((r) => r.text.toLowerCase().includes(kw))
      }
      if (filters.status) {
        result = result.filter((r) => r.status === filters.status)
      }
    }
    filteredActivities.value = result.sort((a, b) => b.time.localeCompare(a.time))
  }

  function fetchActivities(filters?: ActivityFilters): Promise<void> {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        if (activities.value.length === 0) {
          activities.value = generateMockData()
        }
        applyFilters(filters)
        loading.value = false
        resolve()
      }, 300)
    })
  }

  function updateActivity(id: string, payload: Partial<Omit<Activity, 'id'>>) {
    const idx = activities.value.findIndex((i) => i.id === id)
    if (idx === -1) return

    const target = activities.value[idx]
    if (target.status === 'approved') {
      ElMessage.warning('已通过审核的记录不可修改')
      return
    }

    activities.value[idx] = { ...target, ...payload }
    applyFilters()
    ElMessage.success('动态已更新')
  }

  function deleteActivity(id: string) {
    const target = activities.value.find((i) => i.id === id)
    if (!target) return

    if (target.status === 'approved') {
      ElMessage.warning('已通过审核的记录不可删除')
      return
    }

    activities.value = activities.value.filter((i) => i.id !== id)
    applyFilters()
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
