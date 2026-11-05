import type {
  AuditApprovePayload,
  AuditApproveResult,
  AuditBatchApprovePayload,
  AuditBatchResult,
  AuditHistoryItem,
  AuditHistoryQuery,
  AuditPendingDetail,
  AuditPendingItem,
  AuditPendingQuery,
  AuditRejectPayload,
  AuditRejectResult,
  AuditRejectTemplate,
  AuditRevokePayload,
  AuditRevokeResult,
  PageResult,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 待审核任务（/teacher/audits）===================== */

/** 待审核列表（范围/学期/关键字过滤，sortBy 默认 submit_time） */
export function listAuditPending(params: AuditPendingQuery): Promise<PageResult<AuditPendingItem>> {
  return request.get('/teacher/audits/pending', { params })
}

/**
 * 待审核详情。
 * 详情接口会同步读取列表筛选条件以计算上一条/下一条游标（cursor），
 * 因此需把当前列表的过滤参数一并传入（含 sortOrder）。
 */
export function getAuditPendingDetail(
  taskId: number,
  params?: AuditPendingQuery,
): Promise<AuditPendingDetail> {
  return request.get(`/teacher/audits/pending/${taskId}`, { params })
}

/** 审核通过（comment 可空，nextAuditorId 用于转交下一级） */
export function approveAuditTask(
  taskId: number,
  payload: AuditApprovePayload,
): Promise<AuditApproveResult> {
  return request.post(`/teacher/audits/${taskId}/approve`, payload)
}

/** 审核退回（后端要求 comment 必填，不可为空） */
export function rejectAuditTask(
  taskId: number,
  payload: AuditRejectPayload,
): Promise<AuditRejectResult> {
  return request.post(`/teacher/audits/${taskId}/reject`, payload)
}

/** 批量通过（无批量退回接口，见核查报告） */
export function batchApproveAuditTasks(
  payload: AuditBatchApprovePayload,
): Promise<AuditBatchResult> {
  return request.post('/teacher/audits/batch/approve', payload)
}

/** 常用退回原因模板 */
export function getAuditRejectTemplates(): Promise<AuditRejectTemplate[]> {
  return request.get('/teacher/audits/reject-templates')
}

/** 撤销已审核记录（接口层面仅 admin 角色可调） */
export function revokeAuditTask(
  taskId: number,
  payload?: AuditRevokePayload,
): Promise<AuditRevokeResult> {
  return request.post(`/teacher/audits/${taskId}/revoke`, payload)
}

/* ===================== 我的审核记录（/teacher/audits/history）===================== */

export function listAuditHistory(params: AuditHistoryQuery): Promise<PageResult<AuditHistoryItem>> {
  return request.get('/teacher/audits/history', { params })
}
