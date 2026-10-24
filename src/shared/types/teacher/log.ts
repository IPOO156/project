/**
 * 教师端/管理端 API 类型 —— 系统日志与教师端操作日志
 */
import type { PageQuery } from './common-types'

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
