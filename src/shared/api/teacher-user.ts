import type {
  CreateUserPayload,
  PageResult,
  PermissionListItem,
  RoleListItem,
  RolePermissionsResult,
  RoleSavePayload,
  ScopeConfigItem,
  UpdateUserPayload,
  UserDetail,
  UserListItem,
  UserListQuery,
} from '@/shared/types/teacher'
import request from './request'

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
