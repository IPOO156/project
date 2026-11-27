import request from './request'

/**
 * 自动保存草稿（PUT /applications/{archiveId}/autosave）
 */
export function autosaveApplication(
  archiveId: number,
  payload: Record<string, unknown>,
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
  /** 待检测字段（键名对应 duplicate_detection_rules.detect_fields），后端只读取 fields 内的值 */
  fields?: Record<string, unknown>
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
  payload: { correctionReason: string; correctedData?: Record<string, unknown> } & Record<
    string,
    unknown
  >,
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

export interface ApplicationGuide {
  type: string
  typeLabel: string
  title: string
  /** 评选说明（后端 evaluateDesc） */
  content: string
  /** 申报说明（后端 applyDesc），后端仅档案类返回 */
  applyDesc?: string
  requirements: Array<{ field: string; label: string; required: boolean; description: string }>
  notes: string[]
  updatedAt: string
}

/** 后端 evaluateRequirements / evaluateNotes 为 JSON 列，接口原样返回 JSON 字符串 */
function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 评选说明接口的原始响应。文档 7.0.2 / 8.1.3 约定返回归一化字段
 * （type/typeLabel/title/content/requirements/notes/updatedAt）；
 * 档案侧实测后端返回的是 `archiveType/typeName/evaluateDesc/evaluateRequirements/evaluateNotes`。
 * 两种形状都兼容，避免后端形状变化时弹窗内容整体为空。
 */
export interface RawGuideResponse {
  type?: string
  archiveType?: string
  typeLabel?: string
  typeName?: string
  title?: string
  content?: string | null
  evaluateDesc?: string | null
  applyDesc?: string | null
  requirements?: unknown
  evaluateRequirements?: unknown
  notes?: unknown
  evaluateNotes?: unknown
  updatedAt?: string
}

/**
 * 归一化评选说明响应（档案 7.0.2 与奖项 8.1.3 共用）。
 * 优先取文档约定的归一化字段，缺失时回退后端原始 evaluate* 字段；
 * evaluateRequirements / evaluateNotes 可能是 JSON 字符串，统一解析为数组。
 */
export function normalizeGuideResponse(
  raw: RawGuideResponse | null,
  fallbackType: string,
): ApplicationGuide {
  const typeName = String(raw?.typeLabel ?? raw?.typeName ?? '')
  const requirementsSource =
    Array.isArray(raw?.requirements) && raw.requirements.length
      ? raw.requirements
      : raw?.evaluateRequirements
  const notesSource = Array.isArray(raw?.notes) && raw.notes.length ? raw.notes : raw?.evaluateNotes
  return {
    type: raw?.type ?? raw?.archiveType ?? fallbackType,
    typeLabel: typeName,
    title: raw?.title || (typeName ? `${typeName}评选说明` : '评选说明'),
    content: raw?.content ?? raw?.evaluateDesc ?? '',
    applyDesc: raw?.applyDesc ?? '',
    requirements: parseJsonArray(requirementsSource)
      .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
      .map((r) => ({
        field: String(r.field ?? ''),
        label: String(r.label ?? ''),
        required: Boolean(r.required),
        description: String(r.description ?? ''),
      })),
    notes: parseJsonArray(notesSource)
      .filter((n): n is string => typeof n === 'string')
      .map((n) => n.trim())
      .filter(Boolean),
    updatedAt: raw?.updatedAt ?? '',
  }
}

/**
 * 获取档案评选说明（GET /applications/{type}/guide）。
 *
 * 后端 ApplicationService.GuideResponse 返回的是
 * `archiveType/typeName/evaluateDesc/evaluateRequirements/evaluateNotes/applyDesc/icon`，
 * 其中两个 evaluate* 字段是数据库 JSON 列的原始字符串；而弹窗消费的是统一的
 * `title/content/requirements/notes` 结构。此前直接把后端响应透传给弹窗，
 * 导致「评选说明」弹窗永远只有标题、正文与要求全部为空。此处统一归一化。
 */
export async function getApplicationGuide(type: string): Promise<ApplicationGuide> {
  const raw = (await request.get(`/applications/${type}/guide`)) as RawGuideResponse | null
  return normalizeGuideResponse(raw, type)
}

// 各类申报的提交入口统一走 shared/api/submission.ts 的 submitApplication(data)：
// 它按类型契约（APPLICATION_CONTRACTS）做字段重命名与枚举归一化后再 POST /applications/{type}。
// 本文件此前另有一套 submitApplication(type, payload) + 11 个 submitXxx 包装，与前者重名且
// 字段未做归一化（直接透传会因驼峰/枚举不匹配被后端拒绝），且全项目零引用，已移除。
