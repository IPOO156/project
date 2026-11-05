/**
 * 教师端/管理端 API 类型 —— 审批流程与步骤/映射（/admin/approval-flows）
 */

/* ===================== 审批流程（/admin/approval-flows）===================== */

export interface ApprovalFlowItem {
  id: number
  schoolId: number | null
  flowName: string
  applicableType: string
  applicableSubType: string | null
  version: number
  isDefault: number
  status: number
  createdAt: string | null
}

export interface ApprovalFlowPayload {
  flowName: string
  applicableType: string
  applicableSubType?: string
  isDefault?: number
  status?: number
}

/* ===================== 审批流程步骤/映射（/admin/approval-flows）===================== */

export interface ApprovalFlowStep {
  id?: number | null
  stepNo: number
  stepName: string
  roleId: number
  scopeType: number
  scopeRule: string
  autoAssign?: number
  allowDelegate?: number
  allowSkip?: number
  allowDesignateNext?: number
  timeoutHours?: number
  rejectAction?: string
  rejectToStep?: number | null
  sort?: number
}

export interface ApprovalFlowDetail extends ApprovalFlowItem {
  steps: ApprovalFlowStep[]
}

export interface ApprovalFlowMapping {
  id: number
  schoolId: number | null
  businessType: string
  businessSubType: string | null
  flowId: number
  flowName: string
  isDefault: number
  effectiveStart: string | null
  effectiveEnd: string | null
  priority: number
  createdAt: string | null
}

export interface ApprovalFlowMappingPayload {
  id?: number
  businessType: string
  businessSubType?: string
  flowId: number
  isDefault?: number
  effectiveStart?: string
  effectiveEnd?: string
  priority?: number
}
