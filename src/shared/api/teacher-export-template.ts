import type {
  ExportTemplateDetail,
  ExportTemplateItem,
  ExportTemplatePayload,
  ExportTemplatePreviewResult,
  PageResult,
  ResearchExportPayload,
  TeacherExportDeleteResult,
  TeacherExportJobListResult,
  TeacherExportTemplate,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 教师端-数据导出（/teacher/exports）===================== */

/**
 * 教师端可用导出模板（GET /teacher/exports/templates）
 * 注意：该接口返回分页包装 { total, list, pagination }（见 /teacher/exports/jobs 同型），
 * 并非裸数组；调用方需解包 .list。曾将整个包装对象当数组赋值给 ref，
 * 导致 v-for 迭代 total/list/pagination 三个键产生 value/label 均 undefined 的空选项。
 */
export function getTeacherExportTemplates(): Promise<PageResult<TeacherExportTemplate>> {
  return request.get('/teacher/exports/templates')
}

/** 教师端导出任务列表（GET /teacher/exports） */
export function getTeacherExportJobs(params: {
  status?: number
  page?: number
  per_page?: number
}): Promise<TeacherExportJobListResult> {
  return request.get('/teacher/exports', { params })
}

/** 删除教师端导出任务（DELETE /teacher/exports/{jobId}） */
export function deleteTeacherExportJob(jobId: number): Promise<TeacherExportDeleteResult> {
  return request.delete(`/teacher/exports/${jobId}`)
}

/* ===================== 导出模板（/admin/export-templates）===================== */

export function listExportTemplates(params: {
  exportType?: string
  status?: number
  page?: number
  per_page?: number
}): Promise<PageResult<ExportTemplateItem>> {
  return request.get('/admin/export-templates', { params })
}

export function createExportTemplate(payload: ExportTemplatePayload): Promise<{ id: number }> {
  return request.post('/admin/export-templates', payload)
}

export function updateExportTemplate(
  id: number,
  payload: Partial<ExportTemplatePayload>,
): Promise<void> {
  return request.put(`/admin/export-templates/${id}`, payload)
}

export function deleteExportTemplate(id: number): Promise<void> {
  return request.delete(`/admin/export-templates/${id}`)
}

export function setDefaultExportTemplate(id: number): Promise<void> {
  return request.put(`/admin/export-templates/${id}/default`)
}

export function updateExportTemplateStatus(id: number, status: number): Promise<void> {
  return request.patch(`/admin/export-templates/${id}/status`, { status })
}

/* ===================== 导出模板详情/预览图（/admin/export-templates）===================== */

export function getExportTemplateDetail(templateId: number): Promise<ExportTemplateDetail> {
  return request.get(`/admin/export-templates/${templateId}`)
}

export function uploadExportTemplatePreview(
  templateId: number,
  file: File,
): Promise<ExportTemplatePreviewResult> {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/admin/export-templates/${templateId}/preview-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/* ===================== 研究数据导出（/admin/exports/research）===================== */

export function submitResearchExport(payload: ResearchExportPayload): Promise<{
  jobId: number
  status: number
  statusLabel: string
  estimatedSeconds: number | null
}> {
  return request.post('/admin/exports/research', payload)
}
