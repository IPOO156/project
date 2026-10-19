import type {
  ArchiveAdminDetail,
  ArchiveAdminListItem,
  ArchiveAdminQuery,
  ArchiveExportPayload,
  ArchiveExportResult,
  ArchiveOverviewResult,
  ExportJobItem,
  PageResult,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 数据导出 ===================== */

/**
 * 提交档案导出（教师端 POST /teacher/exports）
 * 后端教师端接口返回字段与 ArchiveExportResult 兼容（jobId/status/statusLabel/estimatedSeconds）
 */
export function submitArchiveExport(payload: ArchiveExportPayload): Promise<ArchiveExportResult> {
  return request.post('/teacher/exports', payload)
}

/**
 * 管理员端一键导出档案（POST /admin/exports/archives）
 * 与教师端接口的差异：支持 school 级范围、档案状态筛选、sections 定制、用途标记
 * 仅 archive:export 权限用户可调用
 */
export function submitAdminArchiveExport(
  payload: ArchiveExportPayload & {
    grade?: string
    sections?: string[]
    archiveStatus?: number
    purpose?: string
    includeMetadata?: boolean
  },
): Promise<ArchiveExportResult> {
  return request.post('/admin/exports/archives', payload)
}

/** 管理端导出任务单条查询（/admin/exports/{jobId}，教师端无单条等价接口，仅管理员用） */
export function getExportJob(jobId: number): Promise<ExportJobItem> {
  return request.get(`/admin/exports/${jobId}`)
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

/* ===================== 教师端-档案（/teacher/archives）===================== */

/**
 * 教师端学生档案列表（GET /teacher/archives）。
 * 查询参数与响应字段与管理端 /admin/archives 完全一致（后端复用同一套 DTO），
 * 差别仅在鉴权口径：教师按 role_scopes 限定可见学生范围，管理端不限制。
 */
export function listTeacherArchives(
  params: ArchiveAdminQuery,
): Promise<PageResult<ArchiveAdminListItem>> {
  return request.get('/teacher/archives', { params })
}

/** 教师端组织档案汇总（GET /teacher/archives/overview），参数与响应同管理端 */
export function getTeacherArchiveOverview(params: {
  semesterId?: number
  orgType?: number
  orgId?: number
  grade?: string
}): Promise<ArchiveOverviewResult> {
  return request.get('/teacher/archives/overview', { params })
}
