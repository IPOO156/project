import request from './request'

/**
 * 自动保存草稿（PUT /applications/{archiveId}/autosave）
 */
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

// 各类申报的提交入口统一走 shared/api/submission.ts 的 submitApplication(data)：
// 它按类型契约（APPLICATION_CONTRACTS）做字段重命名与枚举归一化后再 POST /applications/{type}。
// 本文件此前另有一套 submitApplication(type, payload) + 11 个 submitXxx 包装，与前者重名且
// 字段未做归一化（直接透传会因驼峰/枚举不匹配被后端拒绝），且全项目零引用，已移除。
