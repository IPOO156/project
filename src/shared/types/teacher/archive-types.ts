/**
 * 教师端/管理端 API 类型 —— 档案管理（/admin/archives）
 */
import type { PageQuery } from './common-types'

export interface ArchiveAdminQuery extends PageQuery {
  grade?: string
  collegeId?: number
  majorId?: number
  classId?: number
  archiveType?: string
  status?: number
  semesterId?: number
  keyword?: string
}

export interface ArchiveAdminListItem {
  archiveId: number
  archiveType: string
  archiveTypeName: string
  title: string
  semesterId: number | null
  semesterName: string | null
  obtainedAt: string | null
  status: number | null
  statusLabel: string | null
  userId: number | null
  studentNo: string | null
  studentName: string | null
  className: string | null
  majorName: string | null
  collegeName: string | null
  grade: string | null
  submittedAt: string | null
}

export interface ArchiveStudentInfo {
  userId: number | null
  studentNo: string | null
  name: string | null
  gender: number | null
  genderLabel: string | null
  className: string | null
  majorName: string | null
  collegeName: string | null
  grade: string | null
}

export interface ArchiveAdminDetail {
  archiveId: number
  archiveType: string
  archiveTypeName: string
  title: string
  semesterId: number | null
  semesterName: string | null
  obtainedAt: string | null
  status: number | null
  statusLabel: string | null
  rejectedReason: string | null
  submittedAt: string | null
  auditedAt: string | null
  auditorName: string | null
  student: ArchiveStudentInfo
  details: Record<string, unknown>
}

export interface ArchiveTypeCountItem {
  archiveType: string
  count: number
}

export interface ArchiveOverviewRow {
  orgId: number
  orgName: string
  studentCount: number | null
  totalArchives: number | null
  submittedCount: number | null
  approvedCount: number | null
  pendingCount: number | null
  rejectedCount: number | null
  draftCount: number | null
  revokedCount: number | null
  archiveTypeDistribution: ArchiveTypeCountItem[]
}

export interface ArchiveOverviewResult {
  orgType: number | null
  rows: ArchiveOverviewRow[]
}
