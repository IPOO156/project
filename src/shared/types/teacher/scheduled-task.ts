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
