/**
 * 教师端/管理端 API 类型 —— 数据导出与导出模板（/admin/exports、/admin/export-templates）
 */

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
