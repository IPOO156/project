import type { Activity, ActivityFilters } from '@/shared/types/types'

function generateMockActivities(): Activity[] {
  return (
    [
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
    ] as Activity[]
  ).sort((a, b) => b.time.localeCompare(a.time))
}

let cachedActivities: Activity[] | null = null

/**
 * 获取动态列表
 * 后端就绪后替换为：return request.get<PaginatedData<Activity>>('/activities', { params })
 */
export function getActivities(filters?: ActivityFilters): Promise<Activity[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!cachedActivities) cachedActivities = generateMockActivities()
      let result = [...cachedActivities]
      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          result = result.filter((r) => r.text.toLowerCase().includes(kw))
        }
        if (filters.status) result = result.filter((r) => r.status === filters.status)
      }
      resolve(result.sort((a, b) => b.time.localeCompare(a.time)))
    }, 300)
  })
}

/**
 * 更新动态
 * 后端就绪后替换为：return request.put(`/activities/${id}`, payload)
 */
export function updateActivity(id: string, payload: Partial<Omit<Activity, 'id'>>): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (cachedActivities) {
        const idx = cachedActivities.findIndex((i) => i.id === id)
        if (idx >= 0) cachedActivities[idx] = { ...cachedActivities[idx], ...payload }
      }
      resolve()
    }, 200)
  })
}

/**
 * 删除动态
 * 后端就绪后替换为：return request.delete(`/activities/${id}`)
 */
export function deleteActivity(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (cachedActivities) cachedActivities = cachedActivities.filter((i) => i.id !== id)
      resolve()
    }, 200)
  })
}
