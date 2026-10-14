/**
 * 教师端/管理端 API 类型 —— 学期管理（/admin/semesters）
 */

export interface SemesterListItem {
  semesterId: number
  name: string
  schoolId: number | null
  schoolName: string | null
  startDate: string | null
  endDate: string | null
  isCurrent: number | null
  status: number | null
  statusLabel: string | null
  createdAt: string | null
}

export interface SemesterSavePayload {
  schoolId?: number
  name: string
  startDate?: string
  endDate?: string
}

export interface SemesterImportPayload {
  schoolId?: number
  fileId: number
  overwrite?: boolean
}

export interface SemesterImportFailItem {
  row: number
  name: string
  reason: string
}

export interface SemesterImportResult {
  totalCount: number
  successCount: number
  failCount: number
  failures: SemesterImportFailItem[]
}
