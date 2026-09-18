import request from './request'

/** 奖项报名通用字段（award_applications 表，字段与后端一致） */
export interface AwardCommonFields {
  semesterId: number
  isDraft?: number
  evidenceFileIds?: number[]
  certificateNo?: string
  issuingUnit?: string
  validUntil?: string
  participantRole?: 'leader' | 'member' | 'solo'
}

/** 奖项报名响应 */
export interface SubmitAwardResult {
  applicationId: number
  status: number
  statusLabel: string
  currentVersion: number
  submitCount: number
}

/** 奖项总览统计（GET /awards/overview） */
export function getAwardsOverview(): Promise<{
  totalSubmissions: number
  pendingReview: number
  approved: number
  newThisSemester: number
  typeDistribution: Record<string, number>
  statusDistribution: Record<string, number>
  semesterTrend: Array<{ semesterId: number; semesterName: string; count: number }>
  recentActivities: Array<{
    id: number
    title: string
    applicant: string
    type: string
    typeLabel: string
    submitTime: string
    status: number
    statusLabel: string
  }>
}> {
  return request.get('/awards/overview')
}

/** 奖项草稿自动保存（PUT /awards/{applicationId}/autosave） */
export function autosaveAward(
  applicationId: number,
  payload: Record<string, any>,
): Promise<{
  applicationId: number
  status: number
  statusLabel: string
  savedAt: string
}> {
  return request.put(`/awards/${applicationId}/autosave`, payload)
}

/** 奖项重复申报检测（POST /awards/duplicate-check） */
export function awardDuplicateCheck(payload: {
  awardType: string
  certificateNo?: string
  title?: string
  participatedTime?: string
}): Promise<{
  isDuplicate: boolean
  duplicateRecords: Array<{
    applicationId: number
    title: string
    status: number
    statusLabel: string
    similarity: number
  }>
  suggestion: string
}> {
  return request.post('/awards/duplicate-check', payload)
}

/** 获取奖项评选说明（GET /awards/{type}/guide） */
export function getAwardGuide(type: string): Promise<{
  type: string
  typeLabel: string
  title: string
  content: string
  requirements: Array<{ field: string; label: string; required: boolean; description: string }>
  notes: string[]
  updatedAt: string
}> {
  return request.get(`/awards/${type}/guide`)
}

/** 获取奖项版本历史（GET /awards/{applicationId}/versions） */
export function getAwardVersions(applicationId: number): Promise<{
  currentVersion: number
  versions: Array<{
    version: number
    title: string
    status: number
    statusLabel: string
    rejectedReason?: string
    createdAt: string
  }>
}> {
  return request.get(`/awards/${applicationId}/versions`)
}

/* ===================== 竞赛之星（POST /awards/competition-star） ===================== */

export function submitCompetitionStar(
  payload: AwardCommonFields & {
    competitionName: string
    participatedTime?: string
    competitionLevel: string
    awardLevel: string
  },
): Promise<SubmitAwardResult> {
  return request.post('/awards/competition-star', payload)
}

/* ===================== 科研之星（POST /awards/research-star） ===================== */

export function submitResearchStar(payload: AwardCommonFields): Promise<{
  applicationId: number
  researchStarId: number
  status: number
  statusLabel: string
}> {
  return request.post('/awards/research-star', payload)
}

/** 添加科研项目（POST /awards/research-star/{researchStarId}/projects） */
export function addResearchProject(
  researchStarId: number,
  payload: {
    projectName: string
    projectLevel: string
    rankTotal: string
    establishedTime: string
    evidenceFileIds?: number[]
  },
): Promise<{ projectId: number }> {
  return request.post(`/awards/research-star/${researchStarId}/projects`, payload)
}

/** 添加软件著作权（POST /awards/research-star/{researchStarId}/software） */
export function addResearchSoftware(
  researchStarId: number,
  payload: {
    softwareName: string
    rankTotal: string
    approvedTime: string
    evidenceFileIds?: number[]
  },
): Promise<{ softwareId: number }> {
  return request.post(`/awards/research-star/${researchStarId}/software`, payload)
}

/** 添加发表论文（POST /awards/research-star/{researchStarId}/papers） */
export function addResearchPaper(
  researchStarId: number,
  payload: {
    journalName: string
    paperTitle: string
    rankTotal: string
    publishedTime: string
    evidenceFileIds?: number[]
  },
): Promise<{ paperId: number }> {
  return request.post(`/awards/research-star/${researchStarId}/papers`, payload)
}

/** 提交科研之星（POST /awards/research-star/{researchStarId}/submit） */
export function submitResearchStarConfirm(researchStarId: number): Promise<SubmitAwardResult> {
  return request.post(`/awards/research-star/${researchStarId}/submit`)
}

/* ===================== 双创之星（POST /awards/innovation-star） ===================== */

export function submitInnovationStar(
  payload: AwardCommonFields & {
    companyName: string
    industryType: string
    applicantRank: string
    registeredTime: string
  },
): Promise<SubmitAwardResult> {
  return request.post('/awards/innovation-star', payload)
}
