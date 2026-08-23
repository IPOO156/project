import type {
  AbilityDimensionItem,
  AbilityDimensionPayload,
  AdminIndicatorTree,
  ApprovalFlowDetail,
  ApprovalFlowItem,
  ApprovalFlowMapping,
  ApprovalFlowMappingPayload,
  ApprovalFlowPayload,
  ApprovalFlowStep,
  ArchiveAdminDetail,
  ArchiveAdminListItem,
  ArchiveAdminQuery,
  ArchiveExportPayload,
  ArchiveExportResult,
  ArchiveOverviewResult,
  CaptchaResponse,
  CommonIndicatorTree,
  CreateUserPayload,
  CurrentUser,
  DashboardStatistics,
  DictItem,
  DictItemCreatePayload,
  DictItemListResult,
  DictItemUpdatePayload,
  DictTypeItem,
  ExportJobItem,
  ExportLogItem,
  ExportLogQuery,
  ExportTemplateDetail,
  ExportTemplateItem,
  ExportTemplatePayload,
  ExportTemplatePreviewResult,
  FilePreviewResult,
  FileUploadResult,
  GradeImportConfigItem,
  GradeImportConfigPayload,
  GradeImportDetail,
  GradeImportListItem,
  GradeImportPayload,
  GradeImportQuery,
  GradeImportResult,
  HeatmapStatistics,
  IndicatorPayload,
  IndicatorRuleVersionItem,
  IndicatorSnapshotPatchPayload,
  IndicatorStatusBatchPayload,
  IndicatorStatusChangeResult,
  LoginLogItem,
  LoginLogQuery,
  LoginPayload,
  LoginResponse,
  MessageBatchIdsPayload,
  MessageCategory,
  MessageItem,
  MessageListResult,
  MessageReadAllResult,
  MessageSetting,
  MessageSettingUpdatePayload,
  OrgOverviewStatistics,
  PageResult,
  PasswordResetConfirmPayload,
  PasswordResetPayload,
  PermissionListItem,
  ResearchExportPayload,
  RoleListItem,
  RolePermissionsResult,
  RoleSavePayload,
  ScopeConfigItem,
  ScoreRecalculatePayload,
  ScoreRecalculateResult,
  ScoreRecalculationTask,
  SemesterImportPayload,
  SemesterImportResult,
  SemesterItem,
  SemesterListItem,
  SemesterSavePayload,
  StatisticsQuery,
  SystemLogItem,
  SystemLogQuery,
  TokenRefreshResult,
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
import { getToken } from '@/shared/utils/token'
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

export function requestPasswordReset(payload: PasswordResetPayload): Promise<void> {
  return request.post('/auth/password/reset', payload)
}

export function confirmPasswordReset(payload: PasswordResetConfirmPayload): Promise<void> {
  return request.post('/auth/password/reset/confirm', payload)
}

export function refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
  return request.post('/auth/refresh', { refreshToken })
}

/* ===================== 系统日志（管理员）===================== */

export function getSystemLogs(params: SystemLogQuery): Promise<PageResult<SystemLogItem>> {
  return request.get('/admin/logs/system', { params })
}

export function getLoginLogs(params: LoginLogQuery): Promise<PageResult<LoginLogItem>> {
  return request.get('/admin/logs/login', { params })
}

export function getExportLogs(params: ExportLogQuery): Promise<PageResult<ExportLogItem>> {
  return request.get('/admin/logs/exports', { params })
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

export function updateMessageSettings(payload: MessageSettingUpdatePayload): Promise<void> {
  return request.put('/messages/settings', payload)
}

export function batchReadMessages(payload: MessageBatchIdsPayload): Promise<MessageReadAllResult> {
  return request.put('/messages/batch-read', payload)
}

export function batchDeleteMessages(
  payload: MessageBatchIdsPayload,
): Promise<MessageReadAllResult> {
  return request.delete('/messages/batch', { data: payload })
}

/* ===================== 文件上传（/common/upload）===================== */

export function uploadFile(file: File, type: string, module: string): Promise<FileUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('module', module)
  return request.post('/common/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/* ===================== 文件管理（/common/files）===================== */

export function getFilePreview(fileId: number): Promise<FilePreviewResult> {
  return request.get(`/common/files/${fileId}/preview`)
}

export function deleteFile(fileId: number): Promise<void> {
  return request.delete(`/common/files/${fileId}`)
}

/** 下载文件（后端 302 重定向到 OSS 签名 URL，绕过统一拦截器以 blob 接收） */
export async function downloadFile(fileId: number, fileName = '下载文件'): Promise<void> {
  const { default: axios } = await import('axios')
  const res = await axios.get(`/api/v1/common/files/${fileId}/download`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const blob = new Blob([res.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ===================== 成绩导入（/admin/grades）===================== */

export function submitGradeImport(payload: GradeImportPayload): Promise<GradeImportResult> {
  return request.post('/admin/grades/import', payload)
}

export function listGradeImports(
  params: GradeImportQuery,
): Promise<PageResult<GradeImportListItem>> {
  return request.get('/admin/grades/imports', { params })
}

export function getGradeImportDetail(importId: number): Promise<GradeImportDetail> {
  return request.get(`/admin/grades/imports/${importId}`)
}

/** 下载成绩导入模板（后端返回 xlsx 二进制，绕过统一拦截器） */
export async function downloadGradeImportTemplate(): Promise<void> {
  const { default: axios } = await import('axios')
  const res = await axios.get('/api/v1/admin/grades/import-template', {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const blob = new Blob([res.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '成绩导入模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ===================== 成绩导入配置（/admin/grade-import-configs）===================== */

export function getGradeImportConfig(): Promise<GradeImportConfigItem> {
  return request.get('/admin/grade-import-configs')
}

export function createGradeImportConfig(
  payload: GradeImportConfigPayload,
): Promise<GradeImportConfigItem> {
  return request.post('/admin/grade-import-configs', payload)
}

export function updateGradeImportConfig(
  id: number,
  payload: Partial<GradeImportConfigPayload>,
): Promise<GradeImportConfigItem> {
  return request.put(`/admin/grade-import-configs/${id}`, payload)
}

export function deleteGradeImportConfig(id: number): Promise<void> {
  return request.delete(`/admin/grade-import-configs/${id}`)
}

export function updateGradeImportConfigStatus(id: number, status: number): Promise<void> {
  return request.patch(`/admin/grade-import-configs/${id}/status`, { status })
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

/* ===================== 档案管理（/admin/archives）===================== */

export function listArchives(params: ArchiveAdminQuery): Promise<PageResult<ArchiveAdminListItem>> {
  return request.get('/admin/archives', { params })
}

export function getArchiveDetail(archiveId: number): Promise<ArchiveAdminDetail> {
  return request.get(`/admin/archives/${archiveId}`)
}

export function getArchiveOverview(params: {
  semesterId?: number
  orgType?: number
  orgId?: number
  grade?: string
}): Promise<ArchiveOverviewResult> {
  return request.get('/admin/archives/overview', { params })
}

/* ===================== 统计看板（/admin/statistics）===================== */

export function getStatisticsDashboard(
  params: Pick<StatisticsQuery, 'semesterId' | 'grade'>,
): Promise<DashboardStatistics> {
  return request.get('/admin/statistics/dashboard', { params })
}

export function getStatisticsOverview(params: StatisticsQuery): Promise<OrgOverviewStatistics> {
  return request.get('/admin/statistics/overview', { params })
}

export function getStatisticsHeatmap(params: StatisticsQuery): Promise<HeatmapStatistics> {
  return request.get('/admin/statistics/heatmap', { params })
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

/* ===================== 导出模板详情/预览图（/admin/export-templates）===================== */

export function getExportTemplateDetail(templateId: number): Promise<ExportTemplateDetail> {
  return request.get(`/admin/export-templates/${templateId}`)
}

export function uploadExportTemplatePreview(
  templateId: number,
  file: File,
): Promise<ExportTemplatePreviewResult> {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/admin/export-templates/${templateId}/preview-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/* ===================== 研究数据导出（/admin/exports/research）===================== */

export function submitResearchExport(payload: ResearchExportPayload): Promise<{
  jobId: number
  status: number
  statusLabel: string
  estimatedSeconds: number | null
}> {
  return request.post('/admin/exports/research', payload)
}

/* ===================== 字典管理（/admin/dict）===================== */

export function listDictTypes(params: {
  keyword?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<DictTypeItem>> {
  return request.get('/admin/dict/types', { params })
}

export function listDictItems(params: {
  dictType?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<DictItemListResult> {
  return request.get('/admin/dict/items', { params })
}

export function createDictItem(payload: DictItemCreatePayload): Promise<{ id: number }> {
  return request.post('/admin/dict/items', payload)
}

export function updateDictItem(itemId: number, payload: DictItemUpdatePayload): Promise<void> {
  return request.put(`/admin/dict/items/${itemId}`, payload)
}

export function deleteDictItem(itemId: number): Promise<void> {
  return request.delete(`/admin/dict/items/${itemId}`)
}

/* ===================== 角色管理（/admin/roles）===================== */

export function listRoles(params: {
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<RoleListItem>> {
  return request.get('/admin/roles', { params })
}

export function createRole(payload: RoleSavePayload): Promise<{ roleId: number }> {
  return request.post('/admin/roles', payload)
}

export function updateRole(roleId: number, payload: RoleSavePayload): Promise<void> {
  return request.put(`/admin/roles/${roleId}`, payload)
}

export function deleteRole(roleId: number): Promise<void> {
  return request.delete(`/admin/roles/${roleId}`)
}

export function getRolePermissions(roleId: number): Promise<RolePermissionsResult> {
  return request.get(`/admin/roles/${roleId}/permissions`)
}

export function assignRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
  return request.put(`/admin/roles/${roleId}/permissions`, { permissionIds })
}

export function listPermissions(params: {
  module?: string
  status?: number
}): Promise<PermissionListItem[]> {
  return request.get('/admin/permissions', { params })
}

/* ===================== 学期管理（/admin/semesters）===================== */

export function listSemesters(params: {
  schoolId?: number
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<SemesterListItem>> {
  return request.get('/admin/semesters', { params })
}

export function createSemester(payload: SemesterSavePayload): Promise<{ semesterId: number }> {
  return request.post('/admin/semesters', payload)
}

export function updateSemester(semesterId: number, payload: SemesterSavePayload): Promise<void> {
  return request.put(`/admin/semesters/${semesterId}`, payload)
}

export function setCurrentSemester(semesterId: number): Promise<void> {
  return request.put(`/admin/semesters/${semesterId}/set-current`)
}

export function updateSemesterStatus(semesterId: number, status: number): Promise<void> {
  return request.put(`/admin/semesters/${semesterId}/status`, { status })
}

export function importSemesters(payload: SemesterImportPayload): Promise<SemesterImportResult> {
  return request.post('/admin/semesters/import', payload)
}

/** 下载学期导入模板（后端返回 xlsx 二进制，绕过统一拦截器） */
export async function downloadSemesterImportTemplate(): Promise<void> {
  const { default: axios } = await import('axios')
  const res = await axios.get('/api/v1/admin/semesters/import-template', {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  const blob = new Blob([res.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '学期导入模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 供部分页面类型标注复用，避免零散 any
export type { MessageItem }
