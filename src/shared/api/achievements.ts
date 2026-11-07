import request from './request'

/* ===================== 成果墙 ===================== */

/** 成果分类（GET /achievements 的 category 枚举） */
export type AchievementCategory =
  'all' | 'honor' | 'contest' | 'practice' | 'research' | 'completion' | 'other'

/** 实践下的二级标签（GET /achievements 的 tag 枚举，仅在 category=practice 时生效） */
export type AchievementPracticeTag = 'volunteer' | 'activity' | 'internship' | 'social_practice'

/** 材料状态（GET /achievements 的 status 枚举） */
export type AchievementMaterialStatus = 'all' | 'archived' | 'missing' | 'pending'

/** 排序（GET /achievements 的 sort 枚举） */
export type AchievementSort = 'date_desc' | 'date_asc' | 'updated_desc'

/** 列表项（接口文档 §3.3） */
export interface AchievementListItem {
  id: string
  title: string
  category: Exclude<AchievementCategory, 'all'>
  categoryLabel: string
  level: string
  issuer: string
  eventAt: string
  thumbnailUrl: string | null
  fileCount: number
  materialStatus: Exclude<AchievementMaterialStatus, 'all'>
  materialLabel: string
  sourceType: string
  sourceId: number
  updatedAt: string
  /** 实践类成果的二级标签；非实践类为空数组 */
  tags: AchievementPracticeTag[]
  /** 成果版本号，每次编辑 +1；申报选材时随引用一起提交，供后端冻结快照 */
  version: number
}

export interface AchievementCounts {
  all: number
  honor: number
  contest: number
  practice: number
  research: number
  completion: number
  other: number
}

export interface AchievementStatusCounts {
  all: number
  archived: number
  missing: number
  pending: number
}

/** 分页键保持后端契约的 snake_case，不改成 camelCase */
export interface AchievementPagination {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface AchievementListResult {
  list: AchievementListItem[]
  counts: AchievementCounts
  statusCounts: AchievementStatusCounts
  pagination: AchievementPagination
}

/** 列表查询参数（分页用 page + per_page，不用 types.ts 的 pageNum/pageSize） */
export interface AchievementQuery {
  category?: AchievementCategory
  status?: AchievementMaterialStatus
  /** 实践二级标签，仅 category=practice 时传递 */
  tag?: AchievementPracticeTag
  semesterId?: string
  keyword?: string
  sort?: AchievementSort
  page?: number
  per_page?: number
}

export interface AchievementAttachment {
  fileId: string
  fileName: string
  mimeType: string
  size: number
  url: string
  previewUrl: string | null
  uploadedAt: string
  /** 主附件：详情页「下载证书」默认下这一份 */
  isPrimary: boolean
  sortOrder: number
}

export interface AchievementDetailField {
  label: string
  value: string
}

export interface AchievementDetail {
  id: string
  title: string
  category: Exclude<AchievementCategory, 'all'>
  categoryLabel: string
  level: string
  issuer: string
  eventAt: string
  description: string
  semester: { id: string; name: string } | null
  materialStatus: Exclude<AchievementMaterialStatus, 'all'>
  materialLabel: string
  attachments: AchievementAttachment[]
  fields: AchievementDetailField[]
  audit: {
    status: string
    statusLabel: string
    reviewedAt: string
    reviewerName: string
  } | null
  linked: { activityType: string; activityId: number } | null
  updatedAt: string
  tags: AchievementPracticeTag[]
  version: number
}

/** 申报选材时从成果墙带回的单份附件（ProofUpload / 选材弹窗共用） */
export interface PickedAchievementFile {
  achievementId: string
  achievementVersion: number
  achievementTitle: string
  fileId: string
  fileName: string
  mimeType: string
  url: string
  previewUrl: string | null
}

/** 成果附件原图下载凭证（GET /achievements/{id}/files/{fileId}/download） */
export interface AchievementDownloadTicket {
  /** 短时效签名地址，过期后重新请求本接口 */
  url: string
  /** 后端按「学号_成果名称_颁发日期.扩展名」拼好的文件名 */
  fileName: string
  mimeType: string
  size: number
  expiresAt: string
}

/**
 * 证书附件规格（集中在此，上传表单与校验共用）：
 * - GB/T 36905—2018 规定一个文件只包含一个证照，正反面属于同一证照的两页，
 *   因此「同一份证书多页」按多附件保存，第一张自动作封面；
 * - 高校实际要求跨度极大（单文件 500K～20M、2～5 张），这里取 1–6 页、单页 5MB 一档；
 * - 后端只支持单文件时，前端将多页合成一份 PDF 上传，UI 仍按「页」展示，只换存储策略。
 */
export const ACHIEVEMENT_MAX_PAGES = 6
export const ACHIEVEMENT_MAX_PAGE_SIZE = 5 * 1024 * 1024

/** 学生自传证书入参（不做审核，保存即进墙） */
export interface AchievementCreateInput {
  title: string
  category: Exclude<AchievementCategory, 'all' | 'other'>
  issuer: string
  eventAt: string
  level?: string
  description?: string
  tags?: AchievementPracticeTag[]
  files: File[]
}

/**
 * 成果墙列表。
 * 后端就绪后无需改这里；路径/字段若有出入，只改本函数。
 */
export function getAchievements(
  params: AchievementQuery,
  signal?: AbortSignal,
): Promise<AchievementListResult> {
  return request.get('/achievements', { params, signal })
}

/**
 * 成果详情（灯箱）。
 * 后端就绪后无需改这里；路径/字段若有出入，只改本函数。
 */
export function getAchievementDetail(id: string, signal?: AbortSignal): Promise<AchievementDetail> {
  return request.get(`/achievements/${encodeURIComponent(id)}`, { signal })
}

/**
 * 原图下载凭证。真实后端需返回短时效签名地址。
 * 接口契约见《成果墙扩展方案》2.3。
 */
export function getAchievementFileDownload(
  achievementId: string,
  fileId: string,
  signal?: AbortSignal,
): Promise<AchievementDownloadTicket> {
  return request.get(
    `/achievements/${encodeURIComponent(achievementId)}/files/${encodeURIComponent(fileId)}/download`,
    { signal },
  )
}

/**
 * 学生自传证书。上传即进墙，不做审核。
 * 真实上传接口（文件落库 + 成果落库）尚未与后端确认，暂时直接拒绝；UI 入口保留可见，提交时会提示失败。
 */
export function createAchievement(_input: AchievementCreateInput): Promise<AchievementListItem> {
  return Promise.reject(new Error('成果上传接口待后端确认'))
}
