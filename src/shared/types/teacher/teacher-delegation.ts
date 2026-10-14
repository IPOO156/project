/**
 * 教师端/管理端 API 类型 —— 教师端审批委托（/teacher/delegations）
 */

export interface TeacherUserBrief {
  userId: number
  name: string | null
  userNo: string | null
}

export interface TeacherRoleBrief {
  roleId: number
  roleName: string
}

export interface TeacherDelegationItem {
  delegationId: number
  delegator: TeacherUserBrief | null
  delegatee: TeacherUserBrief | null
  role: TeacherRoleBrief | null
  scopeType: number | null
  scopeTypeLabel: string | null
  scopeId: number | null
  scopeName: string | null
  startTime: string | null
  endTime: string | null
  reason: string | null
  /** 0待生效 / 1生效中 / 2已过期 / 3已取消 */
  status: number
  statusLabel: string
  createdAt: string | null
}

export interface TeacherDelegationListResult {
  list: TeacherDelegationItem[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface TeacherDelegationCreatePayload {
  delegateeId: number
  roleId?: number
  scopeType?: number
  scopeId?: number
  startTime: string
  endTime: string
  reason?: string
}

export interface TeacherDelegationCreateResult {
  delegationId: number
  delegateeName: string | null
  status: number
  statusLabel: string
  startTime: string | null
  endTime: string | null
}

export interface TeacherDelegationCancelPayload {
  cancelReason?: string
}

export interface TeacherDelegationCancelResult {
  delegationId: number
  status: number
  statusLabel: string
  cancelledAt: string | null
}

/** 可委托教师（GET /teacher/delegations/candidates 列表项） */
export interface TeacherDelegationCandidate {
  userId: number
  name: string
  userNo: string
  /** 职称，缺失为 null */
  title: string | null
  collegeId: number | null
  collegeName: string | null
  /** 持有的可审批角色名称，如 ["教师","辅导员"] */
  roleNames: string[] | null
}

export interface TeacherDelegationCandidateResult {
  list: TeacherDelegationCandidate[]
  total: number | null
}
