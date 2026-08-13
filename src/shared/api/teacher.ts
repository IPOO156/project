import type {
  AdminIndicatorTree,
  Announcement,
  AnnouncementPublishPayload,
  CaptchaResponse,
  CommonIndicatorTree,
  CurrentUser,
  DictItem,
  FormTemplate,
  FormTemplatePayload,
  LoginPayload,
  LoginResponse,
  MessageCategory,
  MessageItem,
  MessageListResult,
  MessageSetting,
  NavigationItem,
  PageResult,
  PermissionItem,
  RolePermission,
  RolePermissionUpdatePayload,
  SemesterItem,
  SystemLogItem,
  SystemLogQuery,
  UserRoleUpdatePayload,
  UserScope,
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

/* ===================== 管理权限 ===================== */

export function listPermissions(): Promise<PermissionItem[]> {
  return request.get('/admin/permissions/list')
}

export function getRolePermissions(roleId: number): Promise<RolePermission> {
  return request.get(`/admin/permissions/roles/${roleId}`)
}

export function updateRolePermissions(payload: RolePermissionUpdatePayload): Promise<void> {
  return request.put('/admin/permissions/roles', payload)
}

export function getUserRoles(userId: number): Promise<number[]> {
  return request.get(`/admin/permissions/users/${userId}/roles`)
}

export function updateUserRoles(payload: UserRoleUpdatePayload): Promise<void> {
  return request.put('/admin/permissions/users/roles', payload)
}

export function getUserScopes(userId: number): Promise<UserScope[]> {
  return request.get(`/admin/permissions/users/${userId}/scopes`)
}

/* ===================== 导航菜单（读取）===================== */

export function getNavigation(): Promise<NavigationItem[]> {
  return request.get('/admin/navigation')
}

/* ===================== 表单模板 ===================== */

export function listFormTemplates(schoolId?: number): Promise<FormTemplate[]> {
  return request.get('/admin/form-templates', { params: { schoolId } })
}

export function getFormTemplate(id: number): Promise<FormTemplate> {
  return request.get(`/admin/form-templates/${id}`)
}

export function createFormTemplate(payload: FormTemplatePayload): Promise<FormTemplate> {
  return request.post('/admin/form-templates', payload)
}

export function updateFormTemplate(
  id: number,
  payload: Partial<FormTemplate>,
): Promise<FormTemplate> {
  return request.put(`/admin/form-templates/${id}`, payload)
}

export function publishFormTemplate(id: number): Promise<FormTemplate> {
  return request.post(`/admin/form-templates/${id}/publish`)
}

/* ===================== 公告 ===================== */

export function listAnnouncements(schoolId?: number): Promise<Announcement[]> {
  return request.get('/admin/announcements', { params: { schoolId } })
}

export function publishAnnouncement(payload: AnnouncementPublishPayload): Promise<Announcement> {
  return request.post('/admin/announcements', payload)
}

export function deleteAnnouncement(id: number): Promise<void> {
  return request.delete(`/admin/announcements/${id}`)
}

/* ===================== 指标（成绩/亮点维度）===================== */

export function getAdminIndicatorTree(params: {
  schoolId: number
  semesterId?: number
  status?: number
}): Promise<AdminIndicatorTree> {
  return request.get('/admin/indicators/tree', { params })
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
