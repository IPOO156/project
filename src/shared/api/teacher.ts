import type {
  AbilityDimensionItem,
  AbilityDimensionPayload,
  AdminIndicatorTree,
  AnnouncementIdResult,
  AnnouncementItem,
  AnnouncementPayload,
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
  FormTemplateCreatePayload,
  FormTemplateDetail,
  FormTemplateItem,
  FormTemplateUpdatePayload,
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
  OrgClassItem,
  OrgClassQuery,
  OrgClassSavePayload,
  OrgCollegeItem,
  OrgCreateIdResult,
  OrgMajorCreatePayload,
  OrgMajorItem,
  OrgOverviewStatistics,
  OrgSchoolItem,
  PageResult,
  PasswordResetConfirmPayload,
  PasswordResetPayload,
  PermissionListItem,
  ResearchExportPayload,
  RoleListItem,
  RolePermissionsResult,
  RoleSavePayload,
  ScheduledTaskItem,
  ScheduledTaskStatusPayload,
  ScheduledTaskStatusResult,
  ScopeConfigItem,
  ScoreRecalculatePayload,
  ScoreRecalculateResult,
  ScoreRecalculationTask,
  SemesterImportPayload,
  SemesterImportResult,
  SemesterItem,
  SemesterListItem,
  SemesterSavePayload,
  SettingItem,
  SettingUpdatePayload,
  StatisticsQuery,
  SystemLogItem,
  SystemLogQuery,
  TeacherCareerFeedbackPayload,
  TeacherCareerFeedbackResult,
  TeacherCareerPlanDetail,
  TeacherDashboardData,
  TeacherDashboardOverview,
  TeacherDelegationCancelPayload,
  TeacherDelegationCancelResult,
  TeacherDelegationCreatePayload,
  TeacherDelegationCreateResult,
  TeacherDelegationListResult,
  TeacherExportDeleteResult,
  TeacherExportJobListResult,
  TeacherExportTemplate,
  TeacherGrowthTimeline,
  TeacherImprovementSuggestionPayload,
  TeacherImprovementSuggestionResult,
  TeacherLogQuery,
  TeacherSnapshotRefresh,
  TeacherSnapshotRefreshPayload,
  TeacherStudentProfile,
  TeacherWeaknessItem,
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
 * 教师端页面优先使用 /teacher/** 接口（若存在）；教师端无等价接口的管理功能
 * 继续使用 /admin/**（如用户/角色/学期/导出模板/组织架构等），后端缺口见核查报告。
 * 教师消息中心独立走 /teacher/messages（DTO 与学生端 /messages 一致）。
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

/* ===================== 数据导出 ===================== */

/**
 * 提交档案导出（教师端 POST /teacher/exports）
 * 后端教师端接口返回字段与 ArchiveExportResult 兼容（jobId/status/statusLabel/estimatedSeconds）
 */
export function submitArchiveExport(payload: ArchiveExportPayload): Promise<ArchiveExportResult> {
  return request.post('/teacher/exports', payload)
}

/** 管理端导出任务单条查询（/admin/exports/{jobId}，教师端无单条等价接口，仅管理员用） */
export function getExportJob(jobId: number): Promise<ExportJobItem> {
  return request.get(`/admin/exports/${jobId}`)
}

/* ===================== 教师端-数据导出（/teacher/exports）===================== */

/**
 * 教师端可用导出模板（GET /teacher/exports/templates）
 * 注意：该接口返回分页包装 { total, list, pagination }（见 /teacher/exports/jobs 同型），
 * 并非裸数组；调用方需解包 .list。曾将整个包装对象当数组赋值给 ref，
 * 导致 v-for 迭代 total/list/pagination 三个键产生 value/label 均 undefined 的空选项。
 */
export function getTeacherExportTemplates(): Promise<PageResult<TeacherExportTemplate>> {
  return request.get('/teacher/exports/templates')
}

/** 教师端导出任务列表（GET /teacher/exports） */
export function getTeacherExportJobs(params: {
  status?: number
  page?: number
  per_page?: number
}): Promise<TeacherExportJobListResult> {
  return request.get('/teacher/exports', { params })
}

/** 删除教师端导出任务（DELETE /teacher/exports/{jobId}） */
export function deleteTeacherExportJob(jobId: number): Promise<TeacherExportDeleteResult> {
  return request.delete(`/teacher/exports/${jobId}`)
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

/* ===================== 评分重算（教师端 /teacher/scores）===================== */

/** 触发评分重算（教师端仅支持 targetType 1学生/2班级/3学期，前端已去掉 4全量） */
export function triggerScoreRecalculate(
  payload: ScoreRecalculatePayload,
): Promise<ScoreRecalculateResult> {
  return request.post('/teacher/scores/recalculate', payload)
}

export function getRecalculationTask(taskId: number): Promise<ScoreRecalculationTask> {
  return request.get(`/teacher/scores/recalculation-tasks/${taskId}`)
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

/* ===================== 教师端-学生档案（/teacher/students）===================== */

/** 学生成长档案总览（GET /teacher/students/{userId}/profile） */
export async function getTeacherStudentProfile(userId: number): Promise<TeacherStudentProfile> {
  // 后端返回 { isInScope, profile: {...} }，此处展开 profile 供页面扁平化使用
  const res = (await request.get(`/teacher/students/${userId}/profile`)) as unknown as {
    isInScope?: boolean
    profile?: TeacherStudentProfile
  }
  return { isInScope: res?.isInScope ?? true, ...(res?.profile ?? {}) } as TeacherStudentProfile
}

/** 学生成长时间轴（GET /teacher/students/{userId}/growth-timeline） */
export function getTeacherStudentTimeline(
  userId: number,
  params?: { semesterId?: number; eventType?: number },
): Promise<TeacherGrowthTimeline> {
  return request.get(`/teacher/students/${userId}/growth-timeline`, { params })
}

/** 学生短板分析（GET /teacher/students/{userId}/weaknesses） */
export function getTeacherStudentWeaknesses(userId: number): Promise<TeacherWeaknessItem[]> {
  return request.get(`/teacher/students/${userId}/weaknesses`)
}

/** 学生职业规划详情（GET /teacher/students/{userId}/career-plans/{planId}） */
export function getTeacherStudentCareerPlan(
  userId: number,
  planId: number,
): Promise<TeacherCareerPlanDetail> {
  return request.get(`/teacher/students/${userId}/career-plans/${planId}`)
}

/** 教师对职业规划提交反馈（POST /teacher/career-plans/{planId}/feedbacks） */
export function submitTeacherCareerFeedback(
  planId: number,
  payload: TeacherCareerFeedbackPayload,
): Promise<TeacherCareerFeedbackResult> {
  return request.post(`/teacher/career-plans/${planId}/feedbacks`, payload)
}

/** 教师为学生添加改进建议（POST /teacher/students/{userId}/improvement-suggestions） */
export function addTeacherImprovementSuggestion(
  userId: number,
  payload: TeacherImprovementSuggestionPayload,
): Promise<TeacherImprovementSuggestionResult> {
  return request.post(`/teacher/students/${userId}/improvement-suggestions`, payload)
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

/* ===================== 统计看板 ===================== */

/** 教师端统计看板（GET /teacher/statistics/dashboard，字段与 admin 版不同，前端已适配） */
export function getTeacherStatisticsDashboard(
  params: Pick<StatisticsQuery, 'semesterId' | 'grade'>,
): Promise<TeacherDashboardData> {
  return request.get('/teacher/statistics/dashboard', { params })
}

/** 管理端统计看板（/admin/statistics/dashboard，仅管理员，教师端已改用教师版） */
export function getStatisticsDashboard(
  params: Pick<StatisticsQuery, 'semesterId' | 'grade'>,
): Promise<DashboardStatistics> {
  return request.get('/admin/statistics/dashboard', { params })
}

/** 管理端组织统计看板（/admin/statistics/overview，教师端无等价接口） */
export function getStatisticsOverview(params: StatisticsQuery): Promise<OrgOverviewStatistics> {
  return request.get('/admin/statistics/overview', { params })
}

/** 教师端成果热力图（GET /teacher/statistics/heatmap，响应与 admin 版兼容） */
export function getStatisticsHeatmap(params: StatisticsQuery): Promise<HeatmapStatistics> {
  return request.get('/teacher/statistics/heatmap', { params })
}

/** 教师端统计快照刷新（POST /teacher/statistics/refresh） */
export function refreshTeacherStatistics(
  payload: TeacherSnapshotRefreshPayload,
): Promise<TeacherSnapshotRefresh> {
  // 后端以 @RequestParam 接收 semesterId，需走 query 而非 body
  return request.post('/teacher/statistics/refresh', null, { params: payload })
}

/* ===================== 教师端-工作台（GET /teacher/dashboard）===================== */

/** 教师端工作台总览：教师信息/管辖范围/待办统计/今日审核/最近审核动态 */
export function getTeacherDashboardOverview(): Promise<TeacherDashboardOverview> {
  return request.get('/teacher/dashboard')
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

/* ===================== 表单自定义（/admin/form-templates）===================== */

export function listFormTemplates(params: {
  category?: string
  status?: number
  keyword?: string
  page?: number
  per_page?: number
}): Promise<PageResult<FormTemplateItem>> {
  return request.get('/admin/form-templates', { params })
}

export function getFormTemplateDetail(templateId: number): Promise<FormTemplateDetail> {
  return request.get(`/admin/form-templates/${templateId}`)
}

export function createFormTemplate(payload: FormTemplateCreatePayload): Promise<{ id: number }> {
  return request.post('/admin/form-templates', payload)
}

export function updateFormTemplate(
  templateId: number,
  payload: FormTemplateUpdatePayload,
): Promise<void> {
  return request.put(`/admin/form-templates/${templateId}`, payload)
}

export function deleteFormTemplate(templateId: number): Promise<void> {
  return request.delete(`/admin/form-templates/${templateId}`)
}

export function setDefaultFormTemplate(templateId: number): Promise<void> {
  return request.put(`/admin/form-templates/${templateId}/default`)
}

/* ===================== 系统配置（/admin/settings）===================== */

export function listSystemSettings(params?: {
  group?: string
  keyword?: string
  page?: number
  per_page?: number
}): Promise<PageResult<SettingItem>> {
  return request.get('/admin/settings', { params })
}

export function updateSystemSetting(payload: SettingUpdatePayload): Promise<void> {
  return request.put('/admin/settings', payload)
}

/* ===================== 公告管理（/admin/announcements）===================== */

export function listAnnouncements(params: {
  status?: number
  targetType?: string
  page?: number
  per_page?: number
}): Promise<PageResult<AnnouncementItem>> {
  return request.get('/admin/announcements', { params })
}

export function createAnnouncement(payload: AnnouncementPayload): Promise<AnnouncementIdResult> {
  return request.post('/admin/announcements', payload)
}

export function updateAnnouncement(
  announcementId: number,
  payload: AnnouncementPayload,
): Promise<void> {
  return request.put(`/admin/announcements/${announcementId}`, payload)
}

export function deleteAnnouncement(announcementId: number): Promise<void> {
  return request.delete(`/admin/announcements/${announcementId}`)
}

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

/* ===================== 操作日志（/teacher/logs）===================== */

/** 教师端授权范围内操作日志（仅当前教师自身 + 授权范围内学生相关日志） */
export function listTeacherLogs(params: TeacherLogQuery): Promise<PageResult<SystemLogItem>> {
  return request.get('/teacher/logs', { params })
}

/* ===================== 教师消息中心（/teacher/messages）===================== */

export interface TeacherMessageArchiveResult {
  messageId: number
  isArchived: number
  archivedAt: string | null
}

export function getTeacherMessages(params: {
  category?: MessageCategory | string
  isRead?: number
  isArchived?: number
  keyword?: string
  page?: number
  per_page?: number
}): Promise<MessageListResult> {
  return request.get('/teacher/messages', { params })
}

export function markTeacherMessageRead(messageId: number): Promise<void> {
  return request.put(`/teacher/messages/${messageId}/read`)
}

export function archiveTeacherMessage(messageId: number): Promise<TeacherMessageArchiveResult> {
  return request.put(`/teacher/messages/${messageId}/archive`)
}

/* ===================== 组织架构（/admin/schools|colleges|majors|classes）===================== */

export function listSchools(): Promise<OrgSchoolItem[]> {
  return request.get('/admin/schools')
}

export function listColleges(params?: {
  schoolId?: number
  status?: number
}): Promise<OrgCollegeItem[]> {
  return request.get('/admin/colleges', { params })
}

export function listMajors(params?: {
  collegeId?: number
  schoolId?: number
  status?: number
}): Promise<OrgMajorItem[]> {
  return request.get('/admin/majors', { params })
}

export function listClasses(params: OrgClassQuery): Promise<PageResult<OrgClassItem>> {
  return request.get('/admin/classes', { params })
}

export function createClass(payload: OrgClassSavePayload): Promise<OrgCreateIdResult> {
  return request.post('/admin/classes', payload)
}

export function updateClass(classId: number, payload: OrgClassSavePayload): Promise<void> {
  return request.put(`/admin/classes/${classId}`, payload)
}

export function createMajor(payload: OrgMajorCreatePayload): Promise<OrgCreateIdResult> {
  return request.post('/admin/majors', payload)
}

// 供部分页面类型标注复用，避免零散 any
export type { MessageItem }
