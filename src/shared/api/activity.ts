import type { Activity, ActivityFilters } from '@/shared/types/types'
import request from './request'

function generateMockActivities(): Activity[] {
  return (
    [
      {
        id: '1',
        type: 'submitted',
        text: '学科竞赛申报已提交',
        time: '2026-06-28 14:30',
        status: 'pending',
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
        status: 'pending',
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
        status: 'pending',
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
        status: 'pending',
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
        status: 'pending',
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

const MOCK_ACTIVITIES = generateMockActivities()

const statusMap: Record<number, Activity['status']> = {
  0: 'draft',
  1: 'pending',
  2: 'approved',
  3: 'rejected',
  4: 'withdrawn',
}

/**
 * 获取动态列表
 * 对接后端 GET /activities（6.1），接口异常时回退 Mock。
 */
export function getActivities(filters?: ActivityFilters): Promise<Activity[]> {
  const params: Record<string, any> = { page: 1, per_page: 50 }
  if (filters?.keyword) params.keyword = filters.keyword
  if (filters?.status) params.status = statusValue(filters.status)

  return request
    .get('/activities', { params })
    .then((res: any) =>
      (res?.list ?? []).map((item: any) => ({
        id: String(item.id),
        type:
          item.status === 2
            ? 'approved'
            : item.status === 3
              ? 'rejected'
              : item.status === 4
                ? 'withdrawn'
                : 'submitted',
        text: item.content || item.title,
        // 后端实测返回下划线字段 submit_time（见 activities.ts 接口注释），驼峰 submitTime 仅为历史兼容别名
        time: ((item.submit_time ?? item.submitTime) || '').replace('T', ' ').slice(0, 16),
        status: statusMap[item.status] ?? 'submitted',
      })),
    )
    .catch(() => {
      let result = [...MOCK_ACTIVITIES]
      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          result = result.filter((r) => r.text.toLowerCase().includes(kw))
        }
        if (filters.status) result = result.filter((r) => r.status === filters.status)
      }
      return result.sort((a, b) => b.time.localeCompare(a.time))
    })
}

function statusValue(status: string): number | undefined {
  const map: Record<string, number> = {
    draft: 0,
    submitted: 1,
    pending: 1,
    approved: 2,
    rejected: 3,
    withdrawn: 4,
  }
  return map[status]
}

/** 更新动态（PUT /activities/{id}?type=，当前保留 Mock 回退） */
export function updateActivity(id: string, _payload: Partial<Omit<Activity, 'id'>>): Promise<void> {
  return request
    .put(`/activities/${id}`, _payload, { params: { type: 'archive' } })
    .then(() => undefined)
    .catch(() => undefined)
}

/** 删除动态（DELETE /activities/{id}?type=，当前保留 Mock 回退） */
export function deleteActivity(id: string): Promise<void> {
  return request
    .delete(`/activities/${id}`, { params: { type: 'archive' } })
    .then(() => undefined)
    .catch(() => undefined)
}
