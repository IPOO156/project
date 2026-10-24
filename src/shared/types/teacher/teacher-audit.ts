/**
 * 教师端/管理端 API 类型 —— 教师端待审核任务与审核历史（/teacher/audits）
 */
import type { PageQuery } from './common-types'

/* ===================== 教师端-待审核任务（/teacher/audits）===================== */

/** 审核业务类型：archive 档案申报 / award 奖项报名 / career_plan 职业规划 */
export type AuditBusinessType = 'archive' | 'award' | 'career_plan'

/** GET /teacher/audits/pending 查询参数（范围类参数与列表联动，详情接口需同步携带） */
export interface AuditPendingQuery extends PageQuery {
  type?: string
  archiveType?: string
  scopeType?: number
  scopeId?: number
  semesterId?: number
  grade?: string
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** 4.1 待审核列表项（Lzw.AuditTaskService.PendingListItem） */
export interface AuditPendingItem {
  taskId: number
  type: string
  archiveType: string
  archiveTypeLabel: string
  approvableId: number
  title: string
  applicantId: number
  applicantName: string
  applicantNo: string
  className: string
  majorName: string
  semesterId: number
  semesterName: string
  submitTime: string
  stepNo: number
  stepName: string
  status: number
  statusLabel: string
  duplicateCheckStatus: number
  duplicateCheckStatusLabel: string
}

/** 4.2 详情-申请人信息 */
export interface AuditApplicant {
  userId: number
  name: string
  studentNo: string
  className: string
  majorName: string
  grade: string
}

/** 4.2 详情-申报主体公共字段（baseInfo，可空字段后端可能缺省） */
export interface AuditBaseInfo {
  semesterId: number | null
  semesterName: string | null
  obtainTime: string | null
  certificateNo: string | null
  issuingUnit: string | null
  validUntil: string | null
  participantRole: string | null
  participantRoleLabel: string | null
}

/** 4.2 详情-佐证材料文件 */
export interface AuditEvidenceFile {
  fileId: number
  fileName: string
  fileUrl: string
  previewUrl: string | null
  fileSize: number
}

/** 4.2 详情-重复检测 */
export interface AuditDuplicateInfo {
  isDuplicate: boolean
  duplicateRecords: unknown[]
}

/** 4.2 详情-审批历史节点 */
export interface AuditApprovalHistoryItem {
  nodeId: number
  stepNo: number
  stepName: string
  auditorName: string
  action: number
  actionLabel: string
  comment: string
  createdAt: string
}

/** 4.2 详情-版本历史 */
export interface AuditVersionHistoryItem {
  version: number
  status: number
  statusLabel: string
  createdAt: string
}

/** 4.2 详情-前后游标（在同一筛选条件下定位上一条/下一条任务） */
export interface AuditCursor {
  prevTaskId: number | null
  nextTaskId: number | null
}

/** 4.2 待审核详情 */
export interface AuditPendingDetail {
  taskId: number
  type: string
  archiveType: string
  approvableId: number
  title: string
  applicant: AuditApplicant | null
  baseInfo: AuditBaseInfo | null
  detail: Record<string, unknown>
  evidenceFiles: AuditEvidenceFile[]
  duplicateInfo: AuditDuplicateInfo | null
  approvalHistory: AuditApprovalHistoryItem[]
  versionHistory: AuditVersionHistoryItem[]
  cursor: AuditCursor | null
}

/** 4.3 审核通过请求/响应 */
export interface AuditApprovePayload {
  comment?: string
  nextAuditorId?: number
}

export interface AuditApproveResult {
  taskId: number
  approvableId: number
  status: number
  statusLabel: string
  auditedAt: string
}

/** 4.4 审核退回请求/响应 */
export interface AuditRejectPayload {
  /** 退回原因（后端必填，不可为空） */
  comment: string
  templateCode?: string
  /** 多级流程退回到指定步骤；当前单节点流程默认退回申请人，可不传 */
  rejectToStep?: number
}

export interface AuditRejectResult {
  taskId: number
  approvableId: number
  status: number
  statusLabel: string
  returnedAt: string
  rejectedReason: string
}

/** 4.5 批量通过请求/响应 */
export interface AuditBatchApprovePayload {
  taskIds: number[]
  comment?: string
}

export interface AuditBatchResultItem {
  taskId: number
  success: boolean
  status: number
}

export interface AuditBatchResult {
  total: number
  success: number
  failed: number
  results: AuditBatchResultItem[]
}

/** 4.7 常用退回原因模板 */
export interface AuditRejectTemplate {
  templateCode: string
  templateContent: string
  usageCount: number
}

/** 4.6 撤销已审核记录（仅 admin 角色） */
export interface AuditRevokePayload {
  revokeReason?: string
}

export interface AuditRevokeResult {
  taskId: number
  approvableId: number
  status: number
  statusLabel: string
  revokeReason: string
  revokedAt: string
}

/* ===================== 教师端-审核历史（/teacher/audits/history）===================== */

export interface AuditHistoryQuery extends PageQuery {
  type?: string
  /** 1通过 2退回 3撤回 4转交 */
  action?: number
  semesterId?: number
  /** YYYY-MM-DD */
  startDate?: string
  /** YYYY-MM-DD */
  endDate?: string
  keyword?: string
}

/** 5.1 审核历史列表项（后端 @JsonInclude(NON_NULL)，关联解析缺失的字段可能缺省） */
export interface AuditHistoryItem {
  auditId: number
  type: string
  archiveType: string | null
  title: string | null
  studentName: string | null
  studentNo: string | null
  action: number
  actionLabel: string | null
  comment: string | null
  auditedAt: string
}
