/**
 * 教师端/管理端 API 类型 —— 统计看板（/admin/statistics）
 */

export interface DimensionAvgScoreItem {
  dimensionCode: string
  dimensionName: string
  avgScore: number | null
}

export interface StatisticsTypeCountItem {
  archiveType: string
  count: number
}

export interface TopInterestItem {
  interest: string
  count: number
}

export interface DashboardStatistics {
  semesterId: number | null
  semesterName: string | null
  studentCount: number | null
  archiveCount: number | null
  awardCount: number | null
  avgGpa: number | null
  approvedCount: number | null
  pendingCount: number | null
  dataCompleteness: number | null
  dimensionAvgScores: DimensionAvgScoreItem[]
  archiveTypeDistribution: StatisticsTypeCountItem[]
  topInterests: TopInterestItem[]
  cacheHit: boolean | null
}

export interface StatisticsParentOrg {
  orgId: number | null
  orgName: string | null
}

export interface OrgOverviewRow {
  orgId: number
  orgName: string
  studentCount: number | null
  archiveCount: number | null
  awardCount: number | null
  avgGpa: number | null
  avgScore: number | null
  practiceCount: number | null
  topInterests: string[]
  dimensionAvgScores: DimensionAvgScoreItem[]
  archiveTypeDistribution: StatisticsTypeCountItem[]
}

export interface OrgOverviewStatistics {
  scopeType: number | null
  parentOrg: StatisticsParentOrg | null
  rows: OrgOverviewRow[]
  cacheHit: boolean | null
}

export interface HeatmapSemesterItem {
  semesterId: number
  semesterName: string
}

export interface HeatmapRow {
  orgId: number
  orgName: string
  values: number[]
  rawValues: number[]
  total: number | null
}

export interface HeatmapStatistics {
  metric: string
  semesters: HeatmapSemesterItem[]
  rows: HeatmapRow[]
  maxValue: number | null
  minValue: number | null
  cacheHit: boolean | null
}

export interface StatisticsQuery {
  semesterId?: number
  scopeType?: number
  scopeId?: number
  orgType?: number
  orgId?: number
  metric?: string
  grade?: string
}
