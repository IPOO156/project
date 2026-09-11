import request from './request'

/** 申报通用字段（所有申报类型均可包含，字段与后端一致） */
export interface ApplicationCommonFields {
  semesterId: number
  isDraft?: number
  evidenceFileIds?: number[]
  participantRole?: 'leader' | 'member' | 'solo'
  certificateNo?: string
  issuingUnit?: string
  validUntil?: string
}

/** 提交申报响应（POST /applications/{type}） */
export interface SubmitApplicationResult {
  archiveId: number
  status: number
  statusLabel: string
  currentVersion: number
  submitCount: number
}

/**
 * 提交/保存申报（按 type 对接对应接口）
 * 学科竞赛 POST /applications/competition
 * 奖学金   POST /applications/scholarship
 * 创新创业 POST /applications/innovation
 * 学术研究 POST /applications/research
 * 荣誉证书 POST /applications/certificate
 * 实习经历 POST /applications/internship
 * 组织履历 POST /applications/organization
 * 实训项目 POST /applications/training
 */
export function submitApplication(
  type: string,
  payload: ApplicationCommonFields & Record<string, any>,
): Promise<SubmitApplicationResult> {
  return request.post(`/applications/${type}`, payload)
}

/** 自动保存草稿（PUT /applications/{archiveId}/autosave） */
export function autosaveApplication(
  archiveId: number,
  payload: Record<string, any>,
): Promise<{
  archiveId: number
  status: number
  statusLabel: string
  savedAt: string
}> {
  return request.put(`/applications/${archiveId}/autosave`, payload)
}

/**
 * 重复申报检测（POST /applications/duplicate-check）
 *  实测（2026-08-23）档案侧返回 hasDuplicate/similarItems/suggestion（奖项 8.x 才是 isDuplicate/duplicateRecords），
 *  字段名以实测为准，勿改回 isDuplicate。
 */
export function duplicateCheck(payload: {
  archiveType: string
  certificateNo?: string
  title?: string
  obtainedTime?: string
}): Promise<{
  hasDuplicate: boolean
  similarItems: Array<{
    archiveId: number
    title: string
    status: number
    statusLabel: string
    similarity: number
  }>
  suggestion: string
}> {
  return request.post('/applications/duplicate-check', payload)
}

/* ===================== 社会实践 ===================== */

export function submitPractice(
  payload: ApplicationCommonFields & {
    activityName: string
    practiceLocation?: string
    practiceUnit?: string
    startDate: string
    endDate: string
    volunteerHours?: number
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('practice', payload)
}

/* ===================== 图书心得 ===================== */

export function submitBookReview(
  payload: ApplicationCommonFields & {
    bookName: string
    readMonth: string
    reviewContent: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('book-review', payload)
}

/* ===================== 版本历史 ===================== */

/** 获取申报版本历史（GET /applications/{archiveId}/versions） */
export function getApplicationVersions(archiveId: number): Promise<{
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
  return request.get(`/applications/${archiveId}/versions`)
}

/* ===================== 更正 ===================== */

/** 更正已通过申报（POST /applications/{archiveId}/correction） */
export function correctApplication(
  archiveId: number,
  payload: {
    correctionReason: string
    correctedData: Record<string, any>
    evidenceFileIds?: number[]
  },
): Promise<{
  archiveId: number
  newArchiveId: number
  oldVersion: number
  newVersion: number
  status: number
  statusLabel: string
}> {
  return request.post(`/applications/${archiveId}/correction`, payload)
}

/** 获取档案评选说明（GET /applications/{type}/guide） */
export function getApplicationGuide(type: string): Promise<{
  type: string
  typeLabel: string
  title: string
  content: string
  requirements: Array<{ field: string; label: string; required: boolean; description: string }>
  notes: string[]
  updatedAt: string
}> {
  return request.get(`/applications/${type}/guide`)
}

/* ===================== 学科竞赛 ===================== */

export function submitCompetition(
  payload: ApplicationCommonFields & {
    competitionName: string
    competitionType: string
    awardLevel: string
    obtainedTime: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('competition', payload)
}

/* ===================== 奖学金 ===================== */

export function submitScholarship(
  payload: ApplicationCommonFields & {
    scholarshipName: string
    scholarshipCategory: string
    awardLevel: string
    obtainedTime: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('scholarship', payload)
}

/* ===================== 创新创业 ===================== */

export function submitInnovation(
  payload: ApplicationCommonFields & {
    companyName: string
    industryType: string
    projectType: string
    registeredTime: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('innovation', payload)
}

/* ===================== 学术研究 ===================== */

export function submitResearch(
  payload: ApplicationCommonFields & {
    projectName: string
    projectLevel: string
    projectType: string
    startDate: string
    endDate: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('research', payload)
}

/* ===================== 荣誉证书 ===================== */

export function submitCertificate(
  payload: ApplicationCommonFields & {
    certificateType: string
    certificateName: string
    obtainedTime: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('certificate', payload)
}

/* ===================== 实习经历 ===================== */

export function submitInternship(
  payload: ApplicationCommonFields & {
    companyName: string
    location?: string
    position?: string
    startDate: string
    endDate: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('internship', payload)
}

/* ===================== 组织履历 ===================== */

export function submitOrganization(
  payload: ApplicationCommonFields & {
    orgLevel?: string
    department?: string
    positionTitle?: string
    startDate: string
    endDate: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('organization', payload)
}

/* ===================== 实训项目 ===================== */

export function submitTraining(
  payload: ApplicationCommonFields & {
    projectName: string
    projectContent?: string
    startDate: string
    endDate: string
  },
): Promise<SubmitApplicationResult> {
  return submitApplication('training', payload)
}
