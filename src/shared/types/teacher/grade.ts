/**
 * 教师端/管理端 API 类型 —— 成绩导入与导入配置（/admin/grades、/admin/grade-import-configs）
 */
import type { PageQuery } from './common-types'

/* ===================== 成绩导入（/admin/grades）===================== */

export interface GradeImportPayload {
  semesterId: number
  fileId: number
  overwrite?: boolean
}

export interface GradeImportResult {
  importId: number
  status: number
  statusLabel: string
  estimatedSeconds: number | null
}

export interface GradeImportQuery extends PageQuery {
  semesterId?: number
  importStatus?: number
}

export interface GradeImportListItem {
  id: number
  semesterId: number | null
  semesterName: string | null
  operatorName: string | null
  fileName: string | null
  totalCount: number | null
  successCount: number | null
  failCount: number | null
  importStatus: number | null
  importStatusLabel: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface GradeImportFailItem {
  row: number
  studentNo: string
  reason: string
}

export interface GradeImportDetail {
  id: number
  semesterId: number | null
  semesterName: string | null
  operatorId: number | null
  operatorName: string | null
  fileId: number | null
  totalCount: number | null
  successCount: number | null
  failCount: number | null
  failDetails: GradeImportFailItem[]
  importStatus: number | null
  importStatusLabel: string | null
  startedAt: string | null
  completedAt: string | null
}

/* ===================== 成绩导入配置（/admin/grade-import-configs）===================== */

export interface GradeImportConfigColumn {
  field: string
  label: string
  required?: boolean
}

export interface GradeImportConfigItem {
  id: number
  schoolId: number | null
  allowedExtensions: string[]
  maxFileSize: number | null
  templateColumns: GradeImportConfigColumn[]
  hasHeaderRow: number | null
  batchSize: number | null
  allowOverwrite: number | null
  status: number | null
  createdBy: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface GradeImportConfigPayload {
  allowedExtensions: string[]
  maxFileSize: number
  templateColumns: GradeImportConfigColumn[]
  hasHeaderRow?: number
  batchSize?: number
  allowOverwrite?: number
  status?: number
}
