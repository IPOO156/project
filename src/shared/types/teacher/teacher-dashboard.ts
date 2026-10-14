/**
 * 教师端/管理端 API 类型 —— 教师端工作台与统计（/teacher/dashboard、/teacher/statistics）
 */
import type { DimensionAvgScoreItem, StatisticsTypeCountItem } from './statistics'

export interface TeacherDashboardScope {
  scopeType: number
  scopeId: number
  scopeName: string
}

export interface TeacherDashboardPendingStats {
  archivePending: number
  awardPending: number
  careerPlanPending: number
  totalPending: number
}

export interface TeacherDashboardRecentAudit {
  id: number
  type: string
  archiveType: string
  title: string
  studentName: string
  studentNo: string
  action: string
  actionLabel: string
  auditedAt: string
}

/** GET /teacher/dashboard 教师端工作台总览 */
export interface TeacherDashboardOverview {
  teacherName: string
  teacherNo: string
  currentSemesterId: number | null
  currentSemesterName: string | null
  scopes: TeacherDashboardScope[]
  pendingStats: TeacherDashboardPendingStats
  todayAudited: number
  recentAudits: TeacherDashboardRecentAudit[]
  unreadMessageCount: number
}

/** GET /teacher/statistics/dashboard 教师端统计看板（字段与 admin 版不同，前端适配） */
export interface TeacherDashboardData {
  semesterId: number | null
  scopeName: string | null
  studentCount: number | null
  submittedCount: number | null
  approvedCount: number | null
  pendingCount: number | null
  rejectedCount: number | null
  averageGpa: number | null
  dimensionAvgScores: DimensionAvgScoreItem[]
  archiveTypeDistribution: StatisticsTypeCountItem[]
  cacheHit: boolean | null
}

/** POST /teacher/statistics/refresh 统计快照刷新 */
export interface TeacherSnapshotRefreshPayload {
  semesterId?: number
  scopeType?: number
  scopeId?: number
}

export interface TeacherSnapshotRefresh {
  schoolId: number | null
  semesterId: number | null
  statDate: string | null
  refreshedAt: string | null
  studentCount: number | null
  archiveCount: number | null
  awardCount: number | null
  avgGpa: number | null
}

/* ===================== 教师端-数据导出（/teacher/exports）===================== */

export interface TeacherExportTemplate {
  templateId: number
  templateName: string
  exportType: string
  exportTypeLabel: string
  scopeType: number | null
  scopeTypeLabel: string | null
}

export interface TeacherExportJob {
  exportJobId: number
  templateName: string | null
  exportType: string
  status: number
  statusLabel: string
  totalCount: number | null
  successCount: number | null
  downloadUrl: string | null
  expireAt: string | null
  createdAt: string | null
}

export interface TeacherExportJobListResult {
  list: TeacherExportJob[]
  pagination?: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface TeacherExportDeleteResult {
  jobId: number
  deletedAt: string | null
}
