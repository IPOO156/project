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

/* ===================== 管理权限 ===================== */

export interface PermissionItem {
  id: number
  name: string
  code: string
  type: number
  parentId: number | null
  sort: number
  status: number
}

export interface RolePermission {
  roleId: number
  roleName: string
  roleCode: string
  permissionIds: number[]
  permissionCodes: string[]
}

export interface RolePermissionUpdatePayload {
  roleId: number
  permissionIds: number[]
}

export interface UserRoleUpdatePayload {
  userId: number
  roleIds: number[]
}

export interface UserScope {
  userId: number
  roleId: number
  roleName: string
  scopeType: number
  scopeTypeLabel: string
  scopeId: number
  scopeName: string
  isPrimary: number
  validFrom: string | null
  validUntil: string | null
  status: number
}

/* ===================== 导航菜单 ===================== */

export interface NavigationItem {
  key: string
  name: string
  path: string
  icon: string | null
  requiredPermission: string | null
  children: NavigationItem[]
}

/* ===================== 表单模板 ===================== */

export interface FormTemplate {
  id: number
  schoolId: number
  templateName: string
  code: string
  category: string
  description: string | null
  fields: unknown | null
  layoutConfig: unknown | null
  applicableRoles: unknown | null
  isDefault: number
  version: number
  status: number
  createdAt: string
  updatedAt: string
}

export type FormTemplatePayload = Partial<FormTemplate> & {
  templateName: string
  code: string
}

/* ===================== 公告 ===================== */

export interface Announcement {
  id: number
  schoolId: number
  title: string
  content: string
  publisherId: number
  targetType: string
  targetId: number | null
  publishedAt: string
  status: number
}

export interface AnnouncementPublishPayload {
  schoolId: number
  title: string
  content: string
  targetType: string
  targetId?: number
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
