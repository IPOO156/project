/**
 * 教师端/管理端 API 类型 —— 用户管理（/admin/users）与角色管理（/admin/roles）
 */
import type { PageQuery } from './common'

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
