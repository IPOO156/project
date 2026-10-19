/**
 * 教师端/管理端 API 类型 —— 定时任务（/admin/scheduled-tasks）
 */

export interface ScheduledTaskItem {
  taskId: number
  taskName: string
  taskCode: string
  taskGroup: string | null
  cronExpression: string | null
  status: number | null
  statusLabel: string | null
  lastRunAt: string | null
  lastRunStatus: number | null
  lastRunStatusLabel: string | null
}

export interface ScheduledTaskStatusPayload {
  status: number
}

export interface ScheduledTaskStatusResult {
  taskId: number
  status: number
  statusLabel: string
}

/** GET /admin/scheduled-tasks/handlers 元素，对应后端 HandlerMeta */
export interface ScheduledTaskHandlerMeta {
  taskCode: string
  handler: string
  name: string
  description: string | null
}

/** POST /admin/scheduled-tasks 请求体，对应 ScheduledTaskCreateRequest */
export interface ScheduledTaskCreatePayload {
  taskName: string
  taskCode: string
  taskGroup: string
  cronExpression: string
  taskHandler: string
  taskParams?: Record<string, unknown> | null
  description?: string
  runType?: number
  maxRetries?: number
  retryDelaySec?: number
  timeoutSec?: number
  status?: number
}

/** PUT /admin/scheduled-tasks/{id} 请求体，对应 ScheduledTaskUpdateRequest（不含 status） */
export type ScheduledTaskUpdatePayload = Omit<ScheduledTaskCreatePayload, 'status'>

/** GET /admin/scheduled-tasks/{id} 响应，对应 ScheduledTaskDetailResponse */
export interface ScheduledTaskDetail {
  taskId: number
  schoolId: number
  taskName: string
  taskCode: string
  taskGroup: string | null
  cronExpression: string | null
  taskHandler: string
  taskParams: Record<string, unknown> | null
  description: string | null
  isSystem: number | null
  runType: number | null
  runTypeLabel: string | null
  maxRetries: number | null
  retryDelaySec: number | null
  timeoutSec: number | null
  lastRunAt: string | null
  lastRunStatus: number | null
  lastRunStatusLabel: string | null
  nextRunAt: string | null
  status: number | null
  statusLabel: string | null
  createdBy: number | null
  createdAt: string | null
  updatedAt: string | null
}

/** DELETE /admin/scheduled-tasks/{id} 响应 */
export interface ScheduledTaskDeleteResult {
  taskId: number
  deletedAt: string
}

/** POST /admin/scheduled-tasks/{id}/trigger 响应，对应 ScheduledTaskTriggerResponse */
export interface ScheduledTaskTriggerResult {
  taskId: number
  taskName: string
  runType: number | null
  runTypeLabel: string | null
  triggeredAt: string
  executeId: string | null
}
