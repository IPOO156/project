/**
 * 教师端/管理端 API 类型 —— 定时任务（/admin/scheduled-tasks）
 *
 * 字段对齐后端 ScheduledTaskManageService / ScheduledTaskHandlerRegistry：
 * 列表 → ScheduledTaskItem；详情/创建/更新返回 ScheduledTaskDetail；
 * 可用处理器列表 → ScheduledTaskHandlerMeta；触发器/删除结果均为极简响应。
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

/** 可用任务处理器元信息（GET /admin/scheduled-tasks/handlers） */
export interface ScheduledTaskHandlerMeta {
  /** 处理器 Bean 名，POST/PUT 请求体 taskHandler 必填此字段 */
  handler: string
  /** 处理器约定的任务编码（如 weekly_report_export），创建时可自动预填 */
  taskCode: string
  /** 处理器展示名，如「每周画像报表导出」 */
  name: string
  /** 处理器用途描述，向使用人解释该任务会做什么 */
  description: string | null
}

/** 新增自定义定时任务请求体（POST /admin/scheduled-tasks） */
export interface ScheduledTaskCreatePayload {
  taskName: string
  taskCode: string
  taskGroup: string
  cronExpression: string
  /** 处理器 Bean 名，只能取 handlers 接口的 handler 值 */
  taskHandler: string
  /** 运行类型：1=Cron，2=单次（后端 ScheduledTaskRunTypeEnum） */
  runType?: number
  taskParams?: Record<string, unknown> | null
  description?: string
  maxRetries?: number
  retryDelaySec?: number
  timeoutSec?: number
  /** 1=启用，0=停用。PUT 更新请求体不带此字段（后端忽略） */
  status?: number
}

/** 更新定时任务请求体（PUT /admin/scheduled-tasks/{id}）。系统内置任务的 taskCode / taskHandler 后端忽略 */
export type ScheduledTaskUpdatePayload = Omit<
  ScheduledTaskCreatePayload,
  'status' | 'taskHandler'
> & {
  taskHandler?: string
}

/** 定时任务详情（GET /admin/scheduled-tasks/{id}；也作为 POST/PUT 的响应体） */
export interface ScheduledTaskDetail {
  taskId: number
  taskName: string
  taskCode: string
  taskGroup: string | null
  taskHandler: string
  cronExpression: string | null
  runType: number
  runTypeLabel: string | null
  status: number
  statusLabel: string | null
  /** 1=系统内置（taskCode/taskHandler 不可改、不可删）；0=自定义 */
  isSystem: number
  nextRunAt: string | null
  lastRunAt: string | null
  lastRunStatus: number | null
  lastRunStatusLabel: string | null
  taskParams: Record<string, unknown> | null
  description: string | null
  maxRetries: number
  retryDelaySec: number
  timeoutSec: number
  createdAt: string | null
  updatedAt: string | null
}

/** 删除自定义任务响应（DELETE /admin/scheduled-tasks/{id}） */
export interface ScheduledTaskDeleteResult {
  taskId: number
  deleted: boolean
}

/** 立即手动触发响应（POST /admin/scheduled-tasks/{id}/trigger） */
export interface ScheduledTaskTriggerResult {
  taskId: number
  /** 触发执行后的 runId / logId，后端未下发时为 null */
  runId: number | null
  /** 后端返回的触发时间（ISO-8601） */
  triggeredAt: string | null
  /** 触发是否已登记调度：true=已入队，false=任务停用/系统拒绝 */
  accepted: boolean
  message?: string | null
}
