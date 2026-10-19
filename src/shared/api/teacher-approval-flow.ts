import type {
  ApprovalFlowDetail,
  ApprovalFlowItem,
  ApprovalFlowMapping,
  ApprovalFlowMappingPayload,
  ApprovalFlowPayload,
  ApprovalFlowStep,
  PageResult,
  TeacherDelegationCancelPayload,
  TeacherDelegationCancelResult,
  TeacherDelegationCandidateResult,
  TeacherDelegationCreatePayload,
  TeacherDelegationCreateResult,
  TeacherDelegationListResult,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 审批流程（/admin/approval-flows）===================== */

export function listApprovalFlows(params: {
  applicableType?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<ApprovalFlowItem>> {
  return request.get('/admin/approval-flows', { params })
}

export function createApprovalFlow(payload: ApprovalFlowPayload): Promise<{ id: number }> {
  return request.post('/admin/approval-flows', payload)
}

export function updateApprovalFlow(
  id: number,
  payload: Partial<ApprovalFlowPayload>,
): Promise<void> {
  return request.put(`/admin/approval-flows/${id}`, payload)
}

export function deleteApprovalFlow(id: number): Promise<void> {
  return request.delete(`/admin/approval-flows/${id}`)
}

/* ===================== 审批流程步骤/映射（/admin/approval-flows）===================== */

export function getApprovalFlowDetail(flowId: number): Promise<ApprovalFlowDetail> {
  return request.get(`/admin/approval-flows/${flowId}`)
}

export function listApprovalFlowSteps(flowId: number): Promise<ApprovalFlowStep[]> {
  return request.get(`/admin/approval-flows/${flowId}/steps`)
}

export function saveApprovalFlowSteps(
  flowId: number,
  steps: ApprovalFlowStep[],
): Promise<{ flowId: number; steps: ApprovalFlowStep[] }> {
  return request.put(`/admin/approval-flows/${flowId}/steps`, { steps })
}

export function listApprovalFlowMappings(params: {
  businessType?: string
  businessSubType?: string
  page?: number
  per_page?: number
}): Promise<PageResult<ApprovalFlowMapping>> {
  return request.get('/admin/approval-flow-mappings', { params })
}

export function upsertApprovalFlowMapping(
  payload: ApprovalFlowMappingPayload,
): Promise<ApprovalFlowMapping> {
  return request.post('/admin/approval-flow-mappings', payload)
}

export function deleteApprovalFlowMapping(mappingId: number): Promise<void> {
  return request.delete(`/admin/approval-flow-mappings/${mappingId}`)
}

/* ===================== 教师端-审批委托（/teacher/delegations）===================== */

export function listTeacherDelegations(params: {
  direction?: number
  status?: number
  keyword?: string
  page?: number
  per_page?: number
}): Promise<TeacherDelegationListResult> {
  return request.get('/teacher/delegations', { params })
}

export function createTeacherDelegation(
  payload: TeacherDelegationCreatePayload,
): Promise<TeacherDelegationCreateResult> {
  return request.post('/teacher/delegations', payload)
}

export function cancelTeacherDelegation(
  delegationId: number,
  payload: TeacherDelegationCancelPayload,
): Promise<TeacherDelegationCancelResult> {
  return request.put(`/teacher/delegations/${delegationId}/cancel`, payload)
}

/**
 * 可委托教师列表（GET /teacher/delegations/candidates）
 * 委托页「被委托人」下拉的数据源：同校、持有可审批角色且启用中的教师，不含当前登录人本人。
 */
export function listTeacherDelegationCandidates(params?: {
  keyword?: string
  collegeId?: number
}): Promise<TeacherDelegationCandidateResult> {
  return request.get('/teacher/delegations/candidates', { params })
}
