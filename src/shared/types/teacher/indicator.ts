/**
 * 教师端/管理端 API 类型 —— 能力维度、指标与评分重算
 *（/admin/ability-dimensions、/admin/indicators、/admin/scores）
 */

/* ===================== 能力维度（/admin/ability-dimensions）===================== */

export interface AbilityDimensionItem {
  id: number
  dimensionName: string
  dimensionCode: string
  description: string | null
  sort: number
  status: number
  statusLabel: string
}

export interface AbilityDimensionPayload {
  dimensionName: string
  dimensionCode: string
  description?: string
  sort: number
}

/* ===================== 评分重算（/admin/scores）===================== */

export interface ScoreRecalculatePayload {
  targetType: number
  targetId?: number
  semesterId: number
}

export interface ScoreRecalculateResult {
  taskId: number
  targetType: number
  targetId: number | null
  semesterId: number
  status: number
  statusLabel: string
  createdAt: string | null
  message: string | null
}

export interface ScoreRecalculationTask {
  id: number
  targetType: number
  targetId: number | null
  semesterId: number
  status: number
  statusLabel: string
  progress: number
  totalCount: number
  successCount: number
  failCount: number
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  message: string | null
  failures: { userId: number; message: string }[] | null
}

/* ===================== 指标 ===================== */

export interface IndicatorNode {
  id: number
  indicatorCode: string
  indicatorName: string
  level: number
  weight: number
  status: number
  statusLabel: string
  version: number
  dimensionCode: string | null
  dimensionName: string | null
  description: string | null
  scoringRule: unknown | null
  sort: number
  children: IndicatorNode[]
}

export interface AdminIndicatorTree {
  versionId: number | null
  version: number
  versionName: string
  effectiveAt: string
  indicators: IndicatorNode[]
}

export interface IndicatorPayload {
  parentId?: number
  indicatorCode: string
  indicatorName: string
  weight: number
  description?: string
  scoringRule?: unknown
  dimensionCode?: string
  sort?: number
}

export interface CommonIndicatorNode {
  indicatorId: number
  indicatorCode: string
  indicatorName: string
  level: number
  weight: number
  dimensionCode: string | null
  dimensionName: string | null
  children: CommonIndicatorNode[]
}

export interface CommonIndicatorTree {
  versionId: number
  versionName: string
  effectiveAt: string
  indicators: CommonIndicatorNode[]
}

/* ===================== 指标规则版本/批量状态（/admin/indicators）===================== */

export interface IndicatorRuleVersionItem {
  id: number
  version: number | null
  versionName: string | null
  semesterId: number | null
  effectiveAt: string | null
  createdBy: number | null
  createdAt: string | null
}

export interface IndicatorStatusBatchPayload {
  indicatorIds: number[]
  status: number
}

export interface IndicatorStatusChangeResult {
  indicatorId: number | null
  status: number
  affectedCount: number
  descendantCount: number
}

export interface IndicatorSnapshotPatchPayload {
  indicatorCode: string
  indicatorName?: string
  description?: string
  newIndicatorCode?: string
}
