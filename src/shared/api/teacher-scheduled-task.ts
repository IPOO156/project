import type {
  PageResult,
  ScheduledTaskCreatePayload,
  ScheduledTaskDeleteResult,
  ScheduledTaskDetail,
  ScheduledTaskHandlerMeta,
  ScheduledTaskItem,
  ScheduledTaskStatusPayload,
  ScheduledTaskStatusResult,
  ScheduledTaskTriggerResult,
  ScheduledTaskUpdatePayload,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 定时任务（/admin/scheduled-tasks）===================== */

export function listScheduledTasks(params: {
  taskGroup?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<ScheduledTaskItem>> {
  return request.get('/admin/scheduled-tasks', { params })
}

export function updateScheduledTaskStatus(
  taskId: number,
  payload: ScheduledTaskStatusPayload,
): Promise<ScheduledTaskStatusResult> {
  return request.put(`/admin/scheduled-tasks/${taskId}/status`, payload)
}

/** 14.3.1 可用处理器列表（创建任务时 taskHandler 只能取此列表的 handler 值） */
export function listScheduledTaskHandlers(): Promise<ScheduledTaskHandlerMeta[]> {
  return request.get('/admin/scheduled-tasks/handlers')
}

/** 14.4 任务详情 */
export function getScheduledTaskDetail(taskId: number): Promise<ScheduledTaskDetail> {
  return request.get(`/admin/scheduled-tasks/${taskId}`)
}

/** 14.3 创建自定义任务 */
export function createScheduledTask(
  payload: ScheduledTaskCreatePayload,
): Promise<ScheduledTaskDetail> {
  return request.post('/admin/scheduled-tasks', payload)
}

/** 14.5 更新任务配置（系统内置任务的 taskCode / taskHandler 后端会忽略） */
export function updateScheduledTask(
  taskId: number,
  payload: ScheduledTaskUpdatePayload,
): Promise<ScheduledTaskDetail> {
  return request.put(`/admin/scheduled-tasks/${taskId}`, payload)
}

/** 14.6 删除自定义任务（系统内置任务后端拒绝） */
export function deleteScheduledTask(taskId: number): Promise<ScheduledTaskDeleteResult> {
  return request.delete(`/admin/scheduled-tasks/${taskId}`)
}

/** 14.7 立即手动触发执行（任务停用时后端拒绝） */
export function triggerScheduledTask(taskId: number): Promise<ScheduledTaskTriggerResult> {
  return request.post(`/admin/scheduled-tasks/${taskId}/trigger`)
}
