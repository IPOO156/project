import type { Activity, ActivityFilters } from '@/shared/types/types'
import request from './request'

const statusMap: Record<number, Activity['status']> = {
  0: 'draft',
  1: 'pending',
  2: 'approved',
  3: 'rejected',
  4: 'withdrawn',
}

/**
 * 获取动态列表
 * 对接后端 GET /activities（6.1）。接口异常时返回空列表，由调用方展示空态，
 * 不注入示例数据（编造的动态会被用户误认为自己的真实申报记录）。
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
    .catch(() => [])
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

// 动态的编辑 / 删除 / 撤回统一由 activities.ts 提供（后端契约为 PUT|DELETE /activities/{type}/{activityId}，
// type 是路径变量而非 query 参数，且必须按记录真实类别传入 archive/award/...，
// 无法在此处从 Activity 视图模型推导）。本文件此前用 `?type=archive` 的写法必然 404，
// 已移除以免被误引用。
