/**
 * 教师端/管理端 API 类型
 * 与后端 DTO 对齐（学生档案系统后端，context-path /api/v1）
 * 字段来源：后端 dto/Fmy 与 service 返回结构，只读核对，不凭空编造。
 */

/** 通用分页查询参数 */
export interface PageQuery {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/** 后端统一分页结果 */
export interface PageResult<T> {
  total: number
  list: T[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

/* ===================== 认证 ===================== */

export interface CaptchaResponse {
  key: string
  image: string
  /**
   * 验证码有效期（秒）。**后端尚未返回，已提需求待补**（GET /auth/captcha 目前只回 key/image）。
   * 后端补上之前，前端按 CAPTCHA_TTL_FALLBACK_SEC 兜底倒计时；字段到位后自动生效，无需再改。
   */
  expiresIn?: number
}

export interface LoginPayload {
  userNo: string
  password: string
  // 字段名 captchaKey：已通过 curl 实测后端（POST /auth/login）读取的是 captchaKey，
  // 传 key 会被视为缺失并返回「验证码标识不能为空」。key 是验证码接口的返回字段，不是登录请求字段。
  captchaKey: string
  captchaCode: string
  rememberMe?: boolean
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string | null
  user: {
    userId: number
    userNo: string
    name: string
    email: string | null
    gender: number
    genderLabel: string
    schoolId: number
    schoolName: string | null
    roles: string[]
    roleNames: string[]
    avatar: string | null
  }
}

/** /auth/me 返回的数据范围 */
export interface AuthScope {
  scopeType: number
  scopeTypeLabel: string
  scopeId: number
  scopeName: string | null
  semesterId: number | null
}

export interface CurrentUser {
  userId: number
  userNo: string
  name: string
  email: string | null
  phone: string | null
  gender: number
  genderLabel: string
  schoolId: number
  schoolName: string | null
  roles: string[]
  roleNames: string[]
  permissions: string[]
  scopes: AuthScope[]
  avatar: string | null
}

/* ===================== 系统日志 ===================== */

export interface SystemLogQuery extends PageQuery {
  operatorId?: number
  roleId?: number
  action?: string
  module?: string
  logLevel?: number
  startTime?: string
  endTime?: string
  relatedType?: string
  relatedId?: number
}

export interface SystemLogItem {
  id: number
  operatorId: number | null
  operatorName: string | null
  roleId: number | null
  roleName: string | null
  action: string | null
  module: string | null
  description: string | null
  beforeData: unknown | null
  afterData: unknown | null
  ipAddress: string | null
  createdAt: string | null
}

export interface LoginLogQuery extends PageQuery {
  userId?: number
  loginStatus?: number
  startTime?: string
  endTime?: string
  ipAddress?: string
}

export interface LoginLogItem {
  id: number
  userId: number | null
  userName: string | null
  loginType: number | null
  ipAddress: string | null
  userAgent: string | null
  loginStatus: number | null
  loginAt: string | null
  logoutAt: string | null
}

export interface ExportLogQuery extends PageQuery {
  operatorId?: number
  exportType?: string
  isAnonymized?: number
  startTime?: string
  endTime?: string
}

export interface ExportLogItem {
  id: number
  exportJobId: number | null
  operatorId: number | null
  operatorName: string | null
  roleName: string | null
  exportType: string | null
  isAnonymized: number | null
  filterConditions: unknown | null
  downloadedAt: string | null
  ipAddress: string | null
  createdAt: string | null
}

/* ===================== 用户管理（/admin/users）===================== */

export interface UserListQuery extends PageQuery {
  roleId?: number
  status?: number
  grade?: string
  keyword?: string
  schoolId?: number
}

export interface UserListItem {
  userId: number
  userNo: string
  name: string
  gender: number | null
  genderLabel: string | null
  email: string | null
  phone: string | null
  schoolId: number | null
  schoolName: string | null
  roles: string[]
  roleNames: string[]
  status: number
  statusLabel: string
  departmentPath: string | null
  createdAt: string | null
}

export interface UserRoleItem {
  roleId: number
  roleName: string
  level: number
}

export interface UserScopeItem {
  scopeType: number
  scopeTypeLabel: string
  scopeId: number
  scopeName: string | null
}

export interface UserDetail {
  userId: number
  userNo: string
  name: string
  email: string | null
  phone: string | null
  gender: number | null
  genderLabel: string | null
  birthDate: string | null
  schoolId: number | null
  schoolName: string | null
  roles: UserRoleItem[]
  status: number
  statusLabel: string
  scopes: UserScopeItem[]
  createdAt: string | null
  lastLoginAt: string | null
}

export interface CreateUserPayload {
  userNo: string
  name: string
  email?: string
  phone?: string
  gender?: number
  schoolId: number
  roleIds: number[]
  classId?: number
  collegeId?: number
  password?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  gender?: number
  classId?: number
  majorId?: number
  collegeId?: number
}

export interface UpdateStatusPayload {
  status: number
}

export interface ResetPasswordPayload {
  newPassword: string
}

export interface UpdateRolesPayload {
  roleIds: number[]
}

export interface ScopeConfigItem {
  scopeType: number
  scopeId: number
  semesterId?: number
}

export interface UpdateScopesPayload {
  scopes: ScopeConfigItem[]
}

/* ===================== 数据导出（/admin/exports）===================== */

export interface ArchiveExportPayload {
  semesterId?: number
  scopeType: number
  scopeId?: number
  grade?: string
  fileType: string
  templateId?: number
  sections?: string[]
  archiveStatus?: number
  purpose?: string
  includeMetadata?: boolean
}

export interface ArchiveExportResult {
  jobId: number
  exportType: string
  status: number
  statusLabel: string
  estimatedSeconds: number | null
}

export interface ExportJobItem {
  id: number
  exportType: string
  status: number
  statusLabel: string
  progress: number
  downloadUrl: string | null
  expireAt: string | null
  createdAt: string | null
  completedAt: string | null
}

/* ===================== 能力维度（/admin/ability-dimensions）===================== */

export interface AbilityDimensionItem {
  id: number
  dimensionName: string
  dimensionCode: string
  description: string | null
  sort: number
  status: number
  statusLabel: string
}

export interface AbilityDimensionPayload {
  dimensionName: string
  dimensionCode: string
  description?: string
  sort: number
}

/* ===================== 评分重算（/admin/scores）===================== */

export interface ScoreRecalculatePayload {
  targetType: number
  targetId?: number
  semesterId: number
}

export interface ScoreRecalculateResult {
  taskId: number
  targetType: number
  targetId: number | null
  semesterId: number
  status: number
  statusLabel: string
  createdAt: string | null
  message: string | null
}

export interface ScoreRecalculationTask {
  id: number
  targetType: number
  targetId: number | null
  semesterId: number
  status: number
  statusLabel: string
  progress: number
  totalCount: number
  successCount: number
  failCount: number
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  message: string | null
  failures: { userId: number; message: string }[] | null
}

/* ===================== 导出模板（/admin/export-templates）===================== */

export interface ExportTemplateItem {
  id: number
  schoolId: number | null
  templateName: string
  templateCode: string
  exportType: string
  exportTypeLabel: string
  scopeType: number | null
  scopeTypeLabel: string | null
  templateMode: number | null
  engineType: string | null
  paperSize: string | null
  orientation: number | null
  orientationLabel: string | null
  version: number
  isDefault: number
  status: number
  statusLabel: string
  previewImage: string | null
  createdBy: number | null
  createdByName: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ExportTemplatePayload {
  templateName: string
  templateCode: string
  exportType: string
  scopeType?: number
  templateMode?: number
  paperSize?: string
  orientation?: number
}

/* ===================== 审批流程（/admin/approval-flows）===================== */

export interface ApprovalFlowItem {
  id: number
  schoolId: number | null
  flowName: string
  applicableType: string
  applicableSubType: string | null
  version: number
  isDefault: number
  status: number
  createdAt: string | null
}

export interface ApprovalFlowPayload {
  flowName: string
  applicableType: string
  applicableSubType?: string
  isDefault?: number
  status?: number
}

/* ===================== 指标 ===================== */

export interface IndicatorNode {
  id: number
  indicatorCode: string
  indicatorName: string
  level: number
  weight: number
  status: number
  statusLabel: string
  version: number
  dimensionCode: string | null
  dimensionName: string | null
  description: string | null
  scoringRule: unknown | null
  sort: number
  children: IndicatorNode[]
}

export interface AdminIndicatorTree {
  versionId: number | null
  version: number
  versionName: string
  effectiveAt: string
  indicators: IndicatorNode[]
}

export interface IndicatorPayload {
  parentId?: number
  indicatorCode: string
  indicatorName: string
  weight: number
  description?: string
  scoringRule?: unknown
  dimensionCode?: string
  sort?: number
}

export interface CommonIndicatorNode {
  indicatorId: number
  indicatorCode: string
  indicatorName: string
  level: number
  weight: number
  dimensionCode: string | null
  dimensionName: string | null
  children: CommonIndicatorNode[]
}

export interface CommonIndicatorTree {
  versionId: number
  versionName: string
  effectiveAt: string
  indicators: CommonIndicatorNode[]
}

/* ===================== 通用下拉 ===================== */

export interface SemesterItem {
  value: number
  label: string
  name: string
  isCurrent: number
}

export interface DictItem {
  value: string
  label: string
  sort: number
}

/* ===================== 消息中心 ===================== */

export type MessageCategory =
  'system_notice' | 'audit_remind' | 'dynamic_remind' | 'private_message'

export interface MessageItem {
  id: number
  category: string
  categoryLabel: string
  title: string
  content: string
  senderType: number
  senderTypeLabel: string
  senderName: string | null
  isRead: number
  readAt: string | null
  isImportant: number
  isArchived: number
  archivedAt: string | null
  deadline: string | null
  jumpUrl: string | null
  sendChannel: string | null
  relatedType: string | null
  relatedId: number | null
  createdAt: string
}

export interface MessageListResult {
  total: number
  unread: number
  list: MessageItem[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface MessageSetting {
  category: string
  categoryLabel: string
  emailEnabled: number
  smsEnabled: number
  pushEnabled: number
}

/* ===================== 文件上传（/common/upload）===================== */

export interface FileUploadResult {
  fileId: number
  fileName: string
  fileUrl: string
  objectKey: string
  fileSize: number
  fileType: string
}

export interface FilePreviewResult {
  fileId: number
  fileName: string
  fileUrl: string
  objectKey: string
  fileType: string
  previewUrl: string | null
  canPreview: boolean
}

/* ===================== 成绩导入（/admin/grades）===================== */

export interface GradeImportPayload {
  semesterId: number
  fileId: number
  overwrite?: boolean
}

export interface GradeImportResult {
  importId: number
  status: number
  statusLabel: string
  estimatedSeconds: number | null
}

export interface GradeImportQuery extends PageQuery {
  semesterId?: number
  importStatus?: number
}

export interface GradeImportListItem {
  id: number
  semesterId: number | null
  semesterName: string | null
  operatorName: string | null
  fileName: string | null
  totalCount: number | null
  successCount: number | null
  failCount: number | null
  importStatus: number | null
  importStatusLabel: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface GradeImportFailItem {
  row: number
  studentNo: string
  reason: string
}

export interface GradeImportDetail {
  id: number
  semesterId: number | null
  semesterName: string | null
  operatorId: number | null
  operatorName: string | null
  fileId: number | null
  totalCount: number | null
  successCount: number | null
  failCount: number | null
  failDetails: GradeImportFailItem[]
  importStatus: number | null
  importStatusLabel: string | null
  startedAt: string | null
  completedAt: string | null
}

/* ===================== 成绩导入配置（/admin/grade-import-configs）===================== */

export interface GradeImportConfigColumn {
  field: string
  label: string
  required?: boolean
}

export interface GradeImportConfigItem {
  id: number
  schoolId: number | null
  allowedExtensions: string[]
  maxFileSize: number | null
  templateColumns: GradeImportConfigColumn[]
  hasHeaderRow: number | null
  batchSize: number | null
  allowOverwrite: number | null
  status: number | null
  createdBy: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface GradeImportConfigPayload {
  allowedExtensions: string[]
  maxFileSize: number
  templateColumns: GradeImportConfigColumn[]
  hasHeaderRow?: number
  batchSize?: number
  allowOverwrite?: number
  status?: number
}

/* ===================== 审批流程步骤/映射（/admin/approval-flows）===================== */

export interface ApprovalFlowStep {
  id?: number | null
  stepNo: number
  stepName: string
  roleId: number
  scopeType: number
  scopeRule: string
  autoAssign?: number
  allowDelegate?: number
  allowSkip?: number
  allowDesignateNext?: number
  timeoutHours?: number
  rejectAction?: string
  rejectToStep?: number | null
  sort?: number
}

export interface ApprovalFlowDetail extends ApprovalFlowItem {
  steps: ApprovalFlowStep[]
}

export interface ApprovalFlowMapping {
  id: number
  schoolId: number | null
  businessType: string
  businessSubType: string | null
  flowId: number
  flowName: string
  isDefault: number
  effectiveStart: string | null
  effectiveEnd: string | null
  priority: number
  createdAt: string | null
}

export interface ApprovalFlowMappingPayload {
  id?: number
  businessType: string
  businessSubType?: string
  flowId: number
  isDefault?: number
  effectiveStart?: string
  effectiveEnd?: string
  priority?: number
}

/* ===================== 档案管理（/admin/archives）===================== */

export interface ArchiveAdminQuery extends PageQuery {
  grade?: string
  collegeId?: number
  majorId?: number
  classId?: number
  archiveType?: string
  status?: number
  semesterId?: number
  keyword?: string
}

export interface ArchiveAdminListItem {
  archiveId: number
  archiveType: string
  archiveTypeName: string
  title: string
  semesterId: number | null
  semesterName: string | null
  obtainedAt: string | null
  status: number | null
  statusLabel: string | null
  userId: number | null
  studentNo: string | null
  studentName: string | null
  className: string | null
  majorName: string | null
  collegeName: string | null
  grade: string | null
  submittedAt: string | null
}

export interface ArchiveStudentInfo {
  userId: number | null
  studentNo: string | null
  name: string | null
  gender: number | null
  genderLabel: string | null
  className: string | null
  majorName: string | null
  collegeName: string | null
  grade: string | null
}

export interface ArchiveAdminDetail {
  archiveId: number
  archiveType: string
  archiveTypeName: string
  title: string
  semesterId: number | null
  semesterName: string | null
  obtainedAt: string | null
  status: number | null
  statusLabel: string | null
  rejectedReason: string | null
  submittedAt: string | null
  auditedAt: string | null
  auditorName: string | null
  student: ArchiveStudentInfo
  details: Record<string, unknown>
}

export interface ArchiveTypeCountItem {
  archiveType: string
  count: number
}

export interface ArchiveOverviewRow {
  orgId: number
  orgName: string
  studentCount: number | null
  totalArchives: number | null
  submittedCount: number | null
  approvedCount: number | null
  pendingCount: number | null
  rejectedCount: number | null
  draftCount: number | null
  revokedCount: number | null
  archiveTypeDistribution: ArchiveTypeCountItem[]
}

export interface ArchiveOverviewResult {
  orgType: number | null
  rows: ArchiveOverviewRow[]
}

/* ===================== 统计看板（/admin/statistics）===================== */

export interface DimensionAvgScoreItem {
  dimensionCode: string
  dimensionName: string
  avgScore: number | null
}

export interface StatisticsTypeCountItem {
  archiveType: string
  count: number
}

export interface TopInterestItem {
  interest: string
  count: number
}

export interface DashboardStatistics {
  semesterId: number | null
  semesterName: string | null
  studentCount: number | null
  archiveCount: number | null
  awardCount: number | null
  avgGpa: number | null
  approvedCount: number | null
  pendingCount: number | null
  dataCompleteness: number | null
  dimensionAvgScores: DimensionAvgScoreItem[]
  archiveTypeDistribution: StatisticsTypeCountItem[]
  topInterests: TopInterestItem[]
  cacheHit: boolean | null
}

export interface StatisticsParentOrg {
  orgId: number | null
  orgName: string | null
}

export interface OrgOverviewRow {
  orgId: number
  orgName: string
  studentCount: number | null
  archiveCount: number | null
  awardCount: number | null
  avgGpa: number | null
  avgScore: number | null
  practiceCount: number | null
  topInterests: string[]
  dimensionAvgScores: DimensionAvgScoreItem[]
  archiveTypeDistribution: StatisticsTypeCountItem[]
}

export interface OrgOverviewStatistics {
  scopeType: number | null
  parentOrg: StatisticsParentOrg | null
  rows: OrgOverviewRow[]
  cacheHit: boolean | null
}

export interface HeatmapSemesterItem {
  semesterId: number
  semesterName: string
}

export interface HeatmapRow {
  orgId: number
  orgName: string
  values: number[]
  rawValues: number[]
  total: number | null
}

export interface HeatmapStatistics {
  metric: string
  semesters: HeatmapSemesterItem[]
  rows: HeatmapRow[]
  maxValue: number | null
  minValue: number | null
  cacheHit: boolean | null
}

export interface StatisticsQuery {
  semesterId?: number
  scopeType?: number
  scopeId?: number
  orgType?: number
  orgId?: number
  metric?: string
  grade?: string
}

/* ===================== 指标规则版本/批量状态（/admin/indicators）===================== */

export interface IndicatorRuleVersionItem {
  id: number
  version: number | null
  versionName: string | null
  semesterId: number | null
  effectiveAt: string | null
  createdBy: number | null
  createdAt: string | null
}

export interface IndicatorStatusBatchPayload {
  indicatorIds: number[]
  status: number
}

export interface IndicatorStatusChangeResult {
  indicatorId: number | null
  status: number
  affectedCount: number
  descendantCount: number
}

export interface IndicatorSnapshotPatchPayload {
  indicatorCode: string
  indicatorName?: string
  description?: string
  newIndicatorCode?: string
}

/* ===================== 导出模板详情/预览图（/admin/export-templates）===================== */

export interface ExportTemplateDetail extends ExportTemplateItem {
  fieldsConfig: unknown
  filterConditions: unknown
  templateModeLabel: string | null
  templateContent: string | null
  pageConfig: unknown
  marginConfig: unknown
  headerHtml: string | null
  footerHtml: string | null
  watermarkConfig: unknown
  fontConfig: unknown
}

export interface ExportTemplatePreviewResult {
  id: number
  previewImage: string
  objectKey: string
  updatedAt: string | null
}

/* ===================== 研究数据导出（/admin/exports/research）===================== */

export interface ResearchExportPayload {
  semesterId: number
  scopeType: number
  scopeId?: number
  grade?: string
  dataTypes: string[]
  fields?: Record<string, unknown>
  isAnonymized?: boolean
  includeMetadata?: boolean
}

/* ===================== 密码重置 / 令牌刷新（/auth）===================== */

export interface PasswordResetPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  verificationCode: string
  email: string
  newPassword: string
  confirmPassword: string
}

export interface TokenRefreshResult {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string | null
}

/* ===================== 消息批量操作 / 设置（/messages）===================== */

export interface MessageBatchIdsPayload {
  messageIds: number[]
}

export interface MessageReadAllResult {
  markedCount: number
}

export interface MessageSettingUpdatePayload {
  category: string
  emailEnabled?: number
  smsEnabled?: number
  pushEnabled?: number
}

/* ===================== 字典管理（/admin/dict）===================== */

export interface DictTypeItem {
  dictType: string
  itemCount: number | null
  status: number | null
  createdAt: string | null
}

export interface DictItemVO {
  id: number
  dictValue: string | null
  label: string | null
  sort: number | null
  status: number | null
  createdAt: string | null
}

export interface DictItemListResult {
  dictType: string | null
  list: DictItemVO[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  } | null
}

export interface DictItemCreatePayload {
  dictType: string
  dictValue: string
  label: string
  sort?: number
  status?: number
}

export interface DictItemUpdatePayload {
  dictValue?: string
  label?: string
  sort?: number
  remark?: string
  status?: number
}

/* ===================== 角色管理（/admin/roles）===================== */

export interface RoleListItem {
  roleId: number
  roleName: string
  roleCode: string
  level: number | null
  status: number | null
  statusLabel: string | null
  description: string | null
  permissionCount: number | null
  userCount: number | null
  createdAt: string | null
}

export interface RoleSavePayload {
  roleName: string
  roleCode: string
  level?: number
  description?: string
  status?: number
}

export interface RolePermissionItem {
  permissionId: number
  permissionCode: string
  permissionName: string
}

export interface RolePermissionsResult {
  roleId: number
  roleName: string
  permissions: RolePermissionItem[]
}

export interface PermissionListItem {
  permissionId: number
  permissionCode: string
  permissionName: string
  status: number | null
}

/* ===================== 学期管理（/admin/semesters）===================== */

export interface SemesterListItem {
  semesterId: number
  name: string
  schoolId: number | null
  schoolName: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: number | null
  status: number | null
  statusLabel: string | null
  createdAt: string | null
}

export interface SemesterSavePayload {
  schoolId?: number
  name: string
  startDate?: string
  endDate?: string
}

export interface SemesterImportPayload {
  schoolId?: number
  fileId: number
  overwrite?: boolean
}

export interface SemesterImportFailItem {
  row: number
  name: string
  reason: string
}

export interface SemesterImportResult {
  totalCount: number
  successCount: number
  failCount: number
  failures: SemesterImportFailItem[]
}

/* ===================== 教师端-工作台（/teacher/dashboard）===================== */

export interface TeacherDashboardScope {
  scopeType: number
  scopeId: number
  scopeName: string
}

export interface TeacherDashboardPendingStats {
  archivePending: number
  awardPending: number
  careerPlanPending: number
  totalPending: number
}

export interface TeacherDashboardRecentAudit {
  id: number
  type: string
  archiveType: string
  title: string
  studentName: string
  studentNo: string
  action: string
  actionLabel: string
  auditedAt: string
}

/** GET /teacher/dashboard 教师端工作台总览 */
export interface TeacherDashboardOverview {
  teacherName: string
  teacherNo: string
  currentSemesterId: number | null
  currentSemesterName: string | null
  scopes: TeacherDashboardScope[]
  pendingStats: TeacherDashboardPendingStats
  todayAudited: number
  recentAudits: TeacherDashboardRecentAudit[]
  unreadMessageCount: number
}

/** GET /teacher/statistics/dashboard 教师端统计看板（字段与 admin 版不同，前端适配） */
export interface TeacherDashboardData {
  semesterId: number | null
  scopeName: string | null
  studentCount: number | null
  submittedCount: number | null
  approvedCount: number | null
  pendingCount: number | null
  rejectedCount: number | null
  averageGpa: number | null
  dimensionAvgScores: DimensionAvgScoreItem[]
  archiveTypeDistribution: StatisticsTypeCountItem[]
  cacheHit: boolean | null
}

/** POST /teacher/statistics/refresh 统计快照刷新 */
export interface TeacherSnapshotRefreshPayload {
  semesterId?: number
  scopeType?: number
  scopeId?: number
}

export interface TeacherSnapshotRefresh {
  schoolId: number | null
  semesterId: number | null
  statDate: string | null
  refreshedAt: string | null
  studentCount: number | null
  archiveCount: number | null
  awardCount: number | null
  avgGpa: number | null
}

/* ===================== 教师端-数据导出（/teacher/exports）===================== */

export interface TeacherExportTemplate {
  templateId: number
  templateName: string
  exportType: string
  exportTypeLabel: string
  scopeType: number | null
  scopeTypeLabel: string | null
}

export interface TeacherExportJob {
  exportJobId: number
  templateName: string | null
  exportType: string
  status: number
  statusLabel: string
  totalCount: number | null
  successCount: number | null
  downloadUrl: string | null
  expireAt: string | null
  createdAt: string | null
}

export interface TeacherExportJobListResult {
  list: TeacherExportJob[]
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface TeacherExportDeleteResult {
  jobId: number
  deletedAt: string | null
}

/* ===================== 教师端-学生档案（/teacher/students）===================== */

export interface TeacherStudentAcademicInfo {
  userId: number
  name: string | null
  studentNo: string | null
  grade: string | null
  major: string | null
  degreeType: number | null
  degreeTypeLabel: string | null
  className: string | null
  collegeName: string | null
  gender: number | null
  genderLabel: string | null
  politicalStatus: number | null
  politicalStatusLabel: string | null
  studentStatus: number | null
  studentStatusLabel: string | null
  birthDate: string | null
}

export interface TeacherStudentContactInfo {
  email: string | null
  phone: string | null
  avatar: string | null
  address: string | null
  emergencyName: string | null
  emergencyRelation: string | null
  emergencyPhone: string | null
}

export interface TeacherDimensionProfileItem {
  dimensionCode: string
  dimensionName: string
  score: number | null
  targetScore: number | null
  gap: number | null
  calculationId: number | null
  ruleVersion: number | null
  calculatedAt: string | null
}

/** GET /teacher/students/{userId}/profile（isInScope + ProfileInfo 扁平展开） */
export interface TeacherStudentProfile {
  isInScope: boolean
  academicInfo: TeacherStudentAcademicInfo
  contactInfo: TeacherStudentContactInfo
  totalVolunteerHours: number | null
  dimensionProfile: TeacherDimensionProfileItem[]
  interests: string[] | null
  semesterGrades: unknown[] | null
  personalAwards: unknown[] | null
  weaknessAnalysis: string | null
  selfEvaluation: string | null
}

/* 成长时间轴 */

export interface TeacherTimelineSummary {
  experiences: number | null
  skills: number | null
  averageGrowth: number | null
  potential: number | null
}

export interface TeacherTimelineItem {
  id: number
  semesterId: number | null
  semesterName: string | null
  eventAt: string | null
  eventName: string
  content: string | null
  eventType: number
  eventTypeLabel: string
  status: number | null
  statusLabel: string | null
  coverImage: string | null
  sourceId: number | null
  sourceType: string | null
  abilityData: unknown | null
  tags: string[] | null
}

export interface TeacherGrowthTimeline {
  summary: TeacherTimelineSummary
  timeline: TeacherTimelineItem[]
  tree: unknown | null
  ring: unknown | null
}

/* 职业规划详情 */

export interface TeacherCareerFeedbackItem {
  id: number
  teacherName: string | null
  feedbackContent: string
  createdAt: string | null
}

/** GET /teacher/students/{userId}/career-plans/{planId} */
export interface TeacherCareerPlanDetail {
  id: number
  semesterId: number | null
  semesterName: string | null
  title: string
  content: string | null
  requirement: string | null
  progressRate: number | null
  status: number | null
  statusLabel: string | null
  submittedAt: string | null
  auditedAt: string | null
  auditorName: string | null
  rejectedReason: string | null
  goals: unknown[] | null
  reflections: unknown[] | null
  feedbacks: TeacherCareerFeedbackItem[]
  versionHistory: unknown[] | null
}

export interface TeacherCareerFeedbackPayload {
  feedbackContent: string
  suggestionItems?: string[]
}

export interface TeacherCareerFeedbackResult {
  feedbackId: number
  createdAt: string | null
}

/* 短板与改进建议 */

export interface TeacherWeaknessItem {
  id: number
  weaknessType: string | null
  weaknessDesc: string | null
  severityLevel: number | null
  source: number | null
  sourceLabel: string | null
  isRead: number | null
  createdAt: string | null
}

export interface TeacherImprovementSuggestionPayload {
  weaknessId?: number
  suggestionType: string
  content: string
  relatedGoalId?: number
}

export interface TeacherImprovementSuggestionResult {
  suggestionId: number
  createdAt: string | null
}

/* ===================== 教师端-审批委托（/teacher/delegations）===================== */

export interface TeacherUserBrief {
  userId: number
  name: string | null
  userNo: string | null
}

export interface TeacherRoleBrief {
  roleId: number
  roleName: string
}

export interface TeacherDelegationItem {
  delegationId: number
  delegator: TeacherUserBrief | null
  delegatee: TeacherUserBrief | null
  role: TeacherRoleBrief | null
  scopeType: number | null
  scopeTypeLabel: string | null
  scopeId: number | null
  scopeName: string | null
  startTime: string | null
  endTime: string | null
  reason: string | null
  /** 0待生效 / 1生效中 / 2已过期 / 3已取消 */
  status: number
  statusLabel: string
  createdAt: string | null
}

export interface TeacherDelegationListResult {
  list: TeacherDelegationItem[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface TeacherDelegationCreatePayload {
  delegateeId: number
  roleId?: number
  scopeType?: number
  scopeId?: number
  startTime: string
  endTime: string
  reason?: string
}

export interface TeacherDelegationCreateResult {
  delegationId: number
  delegateeName: string | null
  status: number
  statusLabel: string
  startTime: string | null
  endTime: string | null
}

export interface TeacherDelegationCancelPayload {
  cancelReason?: string
}

export interface TeacherDelegationCancelResult {
  delegationId: number
  status: number
  statusLabel: string
  cancelledAt: string | null
}

/* ===================== 表单自定义（/admin/form-templates）===================== */

/** 表单字段静态选项（select/radio/checkbox 用，后端结构为 {value,label}） */
export interface FormTemplateOption {
  value: string
  label: string
}

export interface FormTemplateFieldItem {
  key: string
  label: string
  /** input / textarea / number / select / radio / checkbox / date / upload / switch */
  type: string
  required?: boolean
  placeholder?: string
  rules?: unknown
  options?: FormTemplateOption[] | null
  dataSource?: string | null
  visible?: boolean
  sort?: number
}

export interface FormTemplateItem {
  id: number
  schoolId: number | null
  templateName: string
  code: string
  /** archive / award / career_plan */
  category: string
  categoryLabel: string | null
  description: string | null
  applicableRoles: string[] | null
  isDefault: number | null
  version: number | null
  status: number | null
  statusLabel: string | null
  createdBy: number | null
  createdByName: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface FormTemplateDetail extends FormTemplateItem {
  fields: FormTemplateFieldItem[]
  layoutConfig: unknown | null
}

export interface FormTemplateCreatePayload {
  templateName: string
  code: string
  category: string
  description?: string
  fields: FormTemplateFieldItem[]
  layoutConfig?: unknown
  applicableRoles?: string[]
  isDefault?: number
  status?: number
}

export interface FormTemplateUpdatePayload {
  templateName?: string
  description?: string
  fields?: FormTemplateFieldItem[]
  layoutConfig?: unknown
  applicableRoles?: string[]
  status?: number
}

/* ===================== 系统配置（/admin/settings）===================== */

export interface SettingItem {
  settingKey: string
  settingName: string
  settingValue: string | null
  group: string | null
  description: string | null
  updatedAt: string | null
}

export interface SettingUpdatePayload {
  settingKey: string
  settingValue: string
}

/* ===================== 公告管理（/admin/announcements）===================== */

export interface AnnouncementItem {
  announcementId: number
  title: string
  content: string
  /** 发布对象：all/college/major/class（后端枚举 AnnouncementTargetTypeEnum） */
  targetType: string | null
  status: number | null
  statusLabel: string | null
  publishedAt: string | null
  publisherId: number | null
  createdAt: string | null
}

export interface AnnouncementPayload {
  title: string
  content: string
  /** 发布对象：all/college/major/class */
  targetType?: string
  targetId?: number
  status?: number
  publishedAt?: string
}

export interface AnnouncementIdResult {
  announcementId: number
}

/* ===================== 定时任务（/admin/scheduled-tasks）===================== */

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

/* ===================== 教师端-待审核任务（/teacher/audits）===================== */

/** 审核业务类型：archive 档案申报 / award 奖项报名 / career_plan 职业规划 */
export type AuditBusinessType = 'archive' | 'award' | 'career_plan'

/** GET /teacher/audits/pending 查询参数（范围类参数与列表联动，详情接口需同步携带） */
export interface AuditPendingQuery extends PageQuery {
  type?: string
  archiveType?: string
  scopeType?: number
  scopeId?: number
  semesterId?: number
  grade?: string
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** 4.1 待审核列表项（Lzw.AuditTaskService.PendingListItem） */
export interface AuditPendingItem {
  taskId: number
  type: string
  archiveType: string
  archiveTypeLabel: string
  approvableId: number
  title: string
  applicantId: number
  applicantName: string
  applicantNo: string
  className: string
  majorName: string
  semesterId: number
  semesterName: string
  submitTime: string
  stepNo: number
  stepName: string
  status: number
  statusLabel: string
  duplicateCheckStatus: number
  duplicateCheckStatusLabel: string
}

/** 4.2 详情-申请人信息 */
export interface AuditApplicant {
  userId: number
  name: string
  studentNo: string
  className: string
  majorName: string
  grade: string
}

/** 4.2 详情-申报主体公共字段（baseInfo，可空字段后端可能缺省） */
export interface AuditBaseInfo {
  semesterId: number | null
  semesterName: string | null
  obtainTime: string | null
  certificateNo: string | null
  issuingUnit: string | null
  validUntil: string | null
  participantRole: string | null
  participantRoleLabel: string | null
}

/** 4.2 详情-佐证材料文件 */
export interface AuditEvidenceFile {
  fileId: number
  fileName: string
  fileUrl: string
  previewUrl: string | null
  fileSize: number
}

/** 4.2 详情-重复检测 */
export interface AuditDuplicateInfo {
  isDuplicate: boolean
  duplicateRecords: unknown[]
}

/** 4.2 详情-审批历史节点 */
export interface AuditApprovalHistoryItem {
  nodeId: number
  stepNo: number
  stepName: string
  auditorName: string
  action: number
  actionLabel: string
  comment: string
  createdAt: string
}

/** 4.2 详情-版本历史 */
export interface AuditVersionHistoryItem {
  version: number
  status: number
  statusLabel: string
  createdAt: string
}

/** 4.2 详情-前后游标（在同一筛选条件下定位上一条/下一条任务） */
export interface AuditCursor {
  prevTaskId: number | null
  nextTaskId: number | null
}

/** 4.2 待审核详情 */
export interface AuditPendingDetail {
  taskId: number
  type: string
  archiveType: string
  approvableId: number
  title: string
  applicant: AuditApplicant | null
  baseInfo: AuditBaseInfo | null
  detail: Record<string, unknown>
  evidenceFiles: AuditEvidenceFile[]
  duplicateInfo: AuditDuplicateInfo | null
  approvalHistory: AuditApprovalHistoryItem[]
  versionHistory: AuditVersionHistoryItem[]
  cursor: AuditCursor | null
}

/** 4.3 审核通过请求/响应 */
export interface AuditApprovePayload {
  comment?: string
  nextAuditorId?: number
}

export interface AuditApproveResult {
  taskId: number
  approvableId: number
  status: number
  statusLabel: string
  auditedAt: string
}

/** 4.4 审核退回请求/响应 */
export interface AuditRejectPayload {
  /** 退回原因（后端必填，不可为空） */
  comment: string
  templateCode?: string
  /** 多级流程退回到指定步骤；当前单节点流程默认退回申请人，可不传 */
  rejectToStep?: number
}

export interface AuditRejectResult {
  taskId: number
  approvableId: number
  status: number
  statusLabel: string
  returnedAt: string
  rejectedReason: string
}

/** 4.5 批量通过请求/响应 */
export interface AuditBatchApprovePayload {
  taskIds: number[]
  comment?: string
}

export interface AuditBatchResultItem {
  taskId: number
  success: boolean
  status: number
}

export interface AuditBatchResult {
  total: number
  success: number
  failed: number
  results: AuditBatchResultItem[]
}

/** 4.7 常用退回原因模板 */
export interface AuditRejectTemplate {
  templateCode: string
  templateContent: string
  usageCount: number
}

/** 4.6 撤销已审核记录（仅 admin 角色） */
export interface AuditRevokePayload {
  revokeReason?: string
}

export interface AuditRevokeResult {
  taskId: number
  approvableId: number
  status: number
  statusLabel: string
  revokeReason: string
  revokedAt: string
}

/* ===================== 教师端-审核历史（/teacher/audits/history）===================== */

export interface AuditHistoryQuery extends PageQuery {
  type?: string
  /** 1通过 2退回 3撤回 4转交 */
  action?: number
  semesterId?: number
  /** YYYY-MM-DD */
  startDate?: string
  /** YYYY-MM-DD */
  endDate?: string
  keyword?: string
}

/** 5.1 审核历史列表项（后端 @JsonInclude(NON_NULL)，关联解析缺失的字段可能缺省） */
export interface AuditHistoryItem {
  auditId: number
  type: string
  archiveType: string | null
  title: string | null
  studentName: string | null
  studentNo: string | null
  action: number
  actionLabel: string | null
  comment: string | null
  auditedAt: string
}

/* ===================== 教师端-操作日志（/teacher/logs）===================== */

/** GET /teacher/logs 查询参数（比管理端 system 多 grade/keyword） */
export interface TeacherLogQuery extends PageQuery {
  operatorId?: number
  action?: string
  module?: string
  logLevel?: number
  startTime?: string
  endTime?: string
  relatedType?: string
  relatedId?: number
  grade?: string
  keyword?: string
}

/* ===================== 组织架构（/admin/schools|colleges|majors|classes）===================== */

export interface OrgSchoolItem {
  schoolId: number
  schoolName: string
  code: string | null
  status: number | null
}

export interface OrgCollegeItem {
  collegeId: number
  collegeName: string
  code: string | null
  schoolId: number | null
  status: number | null
}

export interface OrgMajorItem {
  majorId: number
  majorName: string
  code: string | null
  collegeId: number | null
  status: number | null
}

export interface OrgClassItem {
  classId: number
  className: string
  grade: string | null
  majorId: number | null
  studentCount: number | null
  status: number | null
}

export interface OrgClassQuery extends PageQuery {
  majorId?: number
  collegeId?: number
  schoolId?: number
  grade?: string
  status?: number
  keyword?: string
}

/** 创建/更新班级（11.5/11.6） */
export interface OrgClassSavePayload {
  majorId: number
  className: string
  grade?: string
  status?: number
}

/** 创建专业（11.7） */
export interface OrgMajorCreatePayload {
  collegeId: number
  majorName: string
  majorCode?: string
  status?: number
}

/** 创建班级/专业响应（classId 或 majorId 二选一） */
export interface OrgCreateIdResult {
  classId?: number
  majorId?: number
}
