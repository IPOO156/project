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
