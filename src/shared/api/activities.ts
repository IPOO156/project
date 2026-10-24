import request from './request'

/** 动态记录类型 */
export type ActivityType = 'archive' | 'award' | 'career_plan'

/**
 * 动态记录列表项（GET /activities）。
 *  实测（2026-08-23）后端实际返回**下划线**字段：archive_type/archive_type_label/submit_time/
 *  semester_name/current_version/submit_count/can_edit/can_delete/can_withdraw。
 *  驼峰字段为历史兼容别名，新代码请优先读取下划线字段。
 */
export interface ActivityListItem {
  id: number
  type: ActivityType
  title: string
  content: string
  status: number
  /** 下划线字段（后端真实返回） */
  archive_type?: string
  archive_type_label?: string
  status_label?: string
  semester_id?: number
  semester_name?: string
  submit_time?: string
  current_version?: number
  submit_count?: number
  can_edit?: boolean
  can_delete?: boolean
  can_withdraw?: boolean
  /** 驼峰兼容别名（旧代码读取，读取时应优先下划线字段） */
  archiveType?: string
  archiveTypeLabel?: string
  statusLabel?: string
  semesterId?: number
  semesterName?: string
  submitTime?: string
  currentVersion?: number
  submitCount?: number
  canEdit?: boolean
  canDelete?: boolean
  canWithdraw?: boolean
}

export interface ActivityListResult {
  total: number
  list: ActivityListItem[]
  pagination: { page: number; per_page: number; total: number; total_pages: number }
}

/** 获取动态记录列表（GET /activities） */
export function getActivities(params?: {
  type?: ActivityType
  archiveType?: string
  status?: number
  semesterId?: number
  keyword?: string
  page?: number
  perPage?: number
}): Promise<ActivityListResult> {
  // 后端 ActivityListRequest 继承 PageParam，Spring 按 JavaBean 属性名绑定查询参数，
  // 实际读取的是 perPage（@JsonProperty("per_page") 只影响 JSON 序列化，对 query 绑定无效）。
  // 传 per_page 会被静默忽略并回落默认 20 条。后端 @Max(100) 限制，超出会被校验拒绝。
  const { perPage, ...rest } = params ?? {}
  const safePerPage = perPage == null ? undefined : Math.min(Math.max(perPage, 1), 100)
  return request.get('/activities', {
    params: { ...rest, ...(safePerPage == null ? {} : { perPage: safePerPage }) },
  })
}

/** 获取动态详情（GET /activities/{type}/{activityId}） */
export function getActivityDetail(activityId: number, type: ActivityType): Promise<any> {
  return request.get(`/activities/${type}/${activityId}`)
}

/** 编辑动态记录（PUT /activities/{type}/{activityId}） */
export function updateActivity(
  activityId: number,
  type: ActivityType,
  payload: Record<string, any>,
): Promise<{
  archiveId: number
  status: number
  statusLabel: string
  currentVersion: number
  submitCount: number
}> {
  return request.put(`/activities/${type}/${activityId}`, payload)
}

/** 删除动态记录（DELETE /activities/{type}/{activityId}） */
export function deleteActivity(activityId: number, type: ActivityType): Promise<void> {
  return request.delete(`/activities/${type}/${activityId}`)
}

/** 撤回申报（PUT /activities/{type}/{activityId}/withdraw） */
export function withdrawActivity(
  activityId: number,
  type: ActivityType,
): Promise<{
  status: number
  statusLabel: string
}> {
  return request.put(`/activities/${type}/${activityId}/withdraw`, null)
}
