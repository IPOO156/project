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
