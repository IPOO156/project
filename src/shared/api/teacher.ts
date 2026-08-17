import type {
  AbilityDimensionItem,
  AbilityDimensionPayload,
  AdminIndicatorTree,
  ApprovalFlowItem,
  ApprovalFlowPayload,
  ArchiveExportPayload,
  ArchiveExportResult,
  CaptchaResponse,
  CommonIndicatorTree,
  CreateUserPayload,
  CurrentUser,
  DictItem,
  ExportJobItem,
  ExportTemplateItem,
  ExportTemplatePayload,
  IndicatorPayload,
  LoginPayload,
  LoginResponse,
  MessageCategory,
  MessageItem,
  MessageListResult,
  MessageSetting,
  PageResult,
  ScopeConfigItem,
  ScoreRecalculatePayload,
  ScoreRecalculateResult,
  ScoreRecalculationTask,
  SemesterItem,
  SystemLogItem,
  SystemLogQuery,
  UpdateUserPayload,
  UserDetail,
  UserListItem,
  UserListQuery,
} from '@/shared/types/teacher'
/**
 * 教师端/管理端 API 层
 *
 * 仅对接后端【已实现】的接口（Fmy/Lzw 包，context-path /api/v1）。
 * 后端尚未实现的教师端接口（/teacher/** 等）不在此处定义，
 * 相关模块页面以「契约层 + 优雅空状态」方式呈现，待后端就绪后补齐。
 */
import request from './request'

/* ===================== 认证 ===================== */

export function getCaptcha(): Promise<CaptchaResponse> {
  return request.get('/auth/captcha')
}

export function teacherLogin(payload: LoginPayload): Promise<LoginResponse> {
  return request.post('/auth/login', payload)
}

export function getCurrentUser(): Promise<CurrentUser> {
  return request.get('/auth/me')
}

export function teacherLogout(): Promise<void> {
  return request.post('/auth/logout')
}

/* ===================== 系统日志（管理员）===================== */

export function getSystemLogs(params: SystemLogQuery): Promise<PageResult<SystemLogItem>> {
  return request.get('/admin/logs/system', { params })
}

/* ===================== 用户管理（/admin/users）===================== */

export function listUsers(params: UserListQuery): Promise<PageResult<UserListItem>> {
  return request.get('/admin/users', { params })
}

export function getUserDetail(userId: number): Promise<UserDetail> {
  return request.get(`/admin/users/${userId}`)
}

export function createUser(payload: CreateUserPayload): Promise<{ userId: number }> {
  return request.post('/admin/users', payload)
}

export function updateUser(userId: number, payload: UpdateUserPayload): Promise<void> {
  return request.put(`/admin/users/${userId}`, payload)
}

export function updateUserStatus(userId: number, status: number): Promise<void> {
  return request.put(`/admin/users/${userId}/status`, { status })
}

export function resetUserPassword(userId: number, newPassword: string): Promise<void> {
  return request.put(`/admin/users/${userId}/password/reset`, { newPassword })
}

export function updateUserRoles(userId: number, roleIds: number[]): Promise<void> {
  return request.put(`/admin/users/${userId}/roles`, { roleIds })
}

export function updateUserScopes(userId: number, scopes: ScopeConfigItem[]): Promise<void> {
  return request.put(`/admin/users/${userId}/scopes`, { scopes })
}

/* ===================== 数据导出（/admin/exports）===================== */

export function submitArchiveExport(payload: ArchiveExportPayload): Promise<ArchiveExportResult> {
  return request.post('/admin/exports/archives', payload)
}

export function getExportJob(jobId: number): Promise<ExportJobItem> {
  return request.get(`/admin/exports/${jobId}`)
}

/* ===================== 能力维度（/admin/ability-dimensions）===================== */

export function listAbilityDimensions(): Promise<AbilityDimensionItem[]> {
  return request.get('/admin/ability-dimensions')
}

export function createAbilityDimension(
  payload: AbilityDimensionPayload,
): Promise<AbilityDimensionItem> {
  return request.post('/admin/ability-dimensions', payload)
}

export function updateAbilityDimension(
  id: number,
  payload: Partial<AbilityDimensionPayload> & { status?: number },
): Promise<AbilityDimensionItem> {
  return request.put(`/admin/ability-dimensions/${id}`, payload)
}

export function deleteAbilityDimension(id: number): Promise<void> {
  return request.delete(`/admin/ability-dimensions/${id}`)
}

/* ===================== 评分重算（/admin/scores）===================== */

export function triggerScoreRecalculate(
  payload: ScoreRecalculatePayload,
): Promise<ScoreRecalculateResult> {
  return request.post('/admin/scores/recalculate', payload)
}

export function getRecalculationTask(taskId: number): Promise<ScoreRecalculationTask> {
  return request.get(`/admin/scores/recalculation-tasks/${taskId}`)
}

/* ===================== 导出模板（/admin/export-templates）===================== */

export function listExportTemplates(params: {
  exportType?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<ExportTemplateItem>> {
  return request.get('/admin/export-templates', { params })
}

export function createExportTemplate(payload: ExportTemplatePayload): Promise<{ id: number }> {
  return request.post('/admin/export-templates', payload)
}

export function updateExportTemplate(
  id: number,
  payload: Partial<ExportTemplatePayload>,
): Promise<void> {
  return request.put(`/admin/export-templates/${id}`, payload)
}

export function deleteExportTemplate(id: number): Promise<void> {
  return request.delete(`/admin/export-templates/${id}`)
}

export function setDefaultExportTemplate(id: number): Promise<void> {
  return request.put(`/admin/export-templates/${id}/default`)
}

export function updateExportTemplateStatus(id: number, status: number): Promise<void> {
  return request.patch(`/admin/export-templates/${id}/status`, { status })
}

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

export function publishIndicators(): Promise<void> {
  return request.post('/admin/indicators/publish')
}

/* ===================== 通用下拉 ===================== */

export function getSemesters(): Promise<SemesterItem[]> {
  return request.get('/common/semesters')
}

export function getDict(dictType: string): Promise<DictItem[]> {
  return request.get('/common/dict', { params: { dictType } })
}

export function getEnums(enumType: string): Promise<DictItem[]> {
  return request.get('/common/enums', { params: { enumType } })
}

export function getCommonIndicators(versionId?: number): Promise<CommonIndicatorTree> {
  return request.get('/common/indicators', { params: { versionId } })
}

/* ===================== 消息中心 ===================== */

export interface MessageQuery {
  category?: MessageCategory | ''
  isRead?: number
  isArchived?: number
  keyword?: string
  page?: number
  per_page?: number
}

export function listMessages(params: MessageQuery): Promise<MessageListResult> {
  return request.get('/messages', { params })
}

export function readMessage(id: number): Promise<void> {
  return request.put(`/messages/${id}/read`)
}

export function readAllMessages(category?: string): Promise<{ markedCount: number }> {
  return request.put('/messages/read-all', null, { params: { category } })
}

export function archiveMessage(id: number): Promise<{
  messageId: number
  isArchived: number
  archivedAt: string | null
}> {
  return request.put(`/messages/${id}/archive`)
}

export function unarchiveMessage(id: number): Promise<{
  messageId: number
  isArchived: number
  archivedAt: string | null
}> {
  return request.put(`/messages/${id}/unarchive`)
}

export function deleteMessage(id: number): Promise<void> {
  return request.delete(`/messages/${id}`)
}

export function getMessageSettings(): Promise<MessageSetting[]> {
  return request.get('/messages/settings')
}

// 供部分页面类型标注复用，避免零散 any
export type { MessageItem }
