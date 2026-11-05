import type {
  ExportLogItem,
  ExportLogQuery,
  LoginLogItem,
  LoginLogQuery,
  PageResult,
  SystemLogItem,
  SystemLogQuery,
  TeacherLogQuery,
} from '@/shared/types/teacher'
import request from './request'

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

/* ===================== 操作日志（/teacher/logs）===================== */

/** 教师端授权范围内操作日志（仅当前教师自身 + 授权范围内学生相关日志） */
export function listTeacherLogs(params: TeacherLogQuery): Promise<PageResult<SystemLogItem>> {
  return request.get('/teacher/logs', { params })
}
