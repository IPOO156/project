import type {
  AdminIndicatorTree,
  IndicatorPayload,
  IndicatorRuleVersionItem,
  IndicatorSnapshotPatchPayload,
  IndicatorStatusBatchPayload,
  IndicatorStatusChangeResult,
  PageResult,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 指标（成绩/亮点维度）===================== */

export function getAdminIndicatorTree(params: {
  semesterId?: number
  status?: number
  draft?: boolean
}): Promise<AdminIndicatorTree> {
  return request.get('/admin/indicators/tree', { params })
}

export function createIndicator(payload: IndicatorPayload): Promise<{ id: number }> {
  return request.post('/admin/indicators', payload)
}

export function updateIndicator(id: number, payload: Partial<IndicatorPayload>): Promise<void> {
  return request.put(`/admin/indicators/${id}`, payload)
}

export function deleteIndicator(id: number): Promise<void> {
  return request.delete(`/admin/indicators/${id}`)
}

export function updateIndicatorStatus(id: number, status: number): Promise<void> {
  return request.patch(`/admin/indicators/${id}/status`, { status })
}

/**
 * 发布指标规则版本请求体（POST /admin/indicators/publish）。
 * 后端 IndicatorPublishRequest 要求 versionName 必填（@NotBlank），
 * 不传体或字段缺失会被框架判为请求体不可读 → 400 10003「请求数据格式错误」。
 */
export interface IndicatorPublishPayload {
  /** 版本名称，如 "2026春-第1版"（必填，≤100 字符） */
  versionName: string
  /** 归属学期 id，不传则后端取该校当前学期 */
  semesterId?: number
}

export function publishIndicators(payload: IndicatorPublishPayload): Promise<{
  version: number
  createdAt: string
}> {
  return request.post('/admin/indicators/publish', payload)
}

/* ===================== 指标规则版本/批量状态（/admin/indicators）===================== */

export function updateIndicatorsStatusBatch(
  payload: IndicatorStatusBatchPayload,
): Promise<IndicatorStatusChangeResult> {
  return request.patch('/admin/indicators/status', payload)
}

export function listIndicatorRuleVersions(params: {
  semesterId?: number
  page?: number
  per_page?: number
}): Promise<PageResult<IndicatorRuleVersionItem>> {
  return request.get('/admin/indicators/rule-versions', { params })
}

export function patchIndicatorRuleVersionSnapshot(
  versionId: number,
  payload: IndicatorSnapshotPatchPayload,
): Promise<void> {
  return request.patch(`/admin/indicators/rule-versions/${versionId}/snapshot`, payload)
}
