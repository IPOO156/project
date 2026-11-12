import {
  APPLICATION_TYPE_MAP,
  AUDIT_DETAIL_LABELS,
  AWARD_LEVELS,
  CERTIFICATE_TYPES,
  COMPANY_TYPE_DISPLAY_OPTIONS,
  COMPETITION_LEVELS,
  COMPETITION_TYPE_DISPLAY_OPTIONS,
  INDUSTRY_TYPE_DISPLAY_OPTIONS,
  ORGANIZATION_LEVEL_DISPLAY_OPTIONS,
  PROJECT_LEVELS,
  RESEARCH_TYPE_DISPLAY_OPTIONS,
  ROLE_OPTIONS,
  SCHOLARSHIP_GRADES,
  SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS,
} from '@/shared/constants/dict'

/**
 * 申报详情字段 → 枚举字典。
 *
 * 后端活动详情（教师端档案详情 detail.details、教师端审核详情 detail.detail）同时返回
 * 原始枚举码与中文 Label 字段（competitionType + competitionTypeLabel），
 * 两个页面必须用同一份映射展示，避免「审核详情是中文、档案详情是 academic」的口径割裂。
 * 字典本身统一取自 businessDict，本文件只维护字段名 → 字典的对应关系。
 */
export const ARCHIVE_DETAIL_ENUM_OPTIONS: Record<
  string,
  readonly { label: string; value: string }[]
> = {
  competitionType: COMPETITION_TYPE_DISPLAY_OPTIONS,
  competitionLevel: COMPETITION_LEVELS,
  awardLevel: AWARD_LEVELS,
  projectLevel: PROJECT_LEVELS,
  participantRole: ROLE_OPTIONS,
  scholarshipGrade: SCHOLARSHIP_GRADES,
  scholarshipLevel: SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS,
  researchType: RESEARCH_TYPE_DISPLAY_OPTIONS,
  projectType: RESEARCH_TYPE_DISPLAY_OPTIONS,
  certType: CERTIFICATE_TYPES,
  organizationLevel: ORGANIZATION_LEVEL_DISPLAY_OPTIONS,
  industryType: INDUSTRY_TYPE_DISPLAY_OPTIONS,
  companyType: COMPANY_TYPE_DISPLAY_OPTIONS,
}

/** 申报类型复合 key → APPLICATION_TYPE_MAP 的 key（如 academic_competition → 学科竞赛） */
const APP_TYPE_KEY_MAP: Record<string, string> = {
  academic_competition: 'competition',
  academic_research: 'research',
  innovation_entrepreneurship: 'innovation',
  social_practice: 'socialPractice',
  honor_certificate: 'certificate',
  training_project: 'training',
  competition: 'competition',
  innovation: 'innovation',
  research: 'research',
  scholarship: 'scholarship',
  certificate: 'certificate',
  internship: 'internship',
  organization: 'organization',
  training: 'training',
}

/**
 * 枚举码 → 中文标签：优先查 ARCHIVE_DETAIL_ENUM_OPTIONS，再查 APPLICATION_TYPE_MAP。
 * 支持字符串枚举（academic）、数字索引枚举（1/2/3）与后端复合 key。
 */
export function translateArchiveEnum(key: string, val: unknown): string | null {
  if (val == null || val === '') return null
  const strVal = String(val)
  const numVal = Number(val)

  const dict = ARCHIVE_DETAIL_ENUM_OPTIONS[key]
  if (dict) {
    const found = dict.find((o) => String(o.value) === strVal || o.label === strVal)
    if (found) return found.label
    // 数字索引兜底（后端返回 1/2/3 而字典 value 是 national/provincial 时）
    if (!Number.isNaN(numVal) && numVal >= 1 && numVal <= dict.length) {
      const indexed = dict[numVal - 1]
      if (indexed && String(indexed.value) !== strVal) return indexed.label
    }
  }

  const mappedKey = APP_TYPE_KEY_MAP[strVal] ?? strVal
  const appType = APPLICATION_TYPE_MAP[mappedKey] ?? APPLICATION_TYPE_MAP[strVal]
  if (appType) return appType

  return null
}

/** 字段名 → 中文标题；后端 *Label 字段按去掉后缀的基础字段名取标题 */
export function archiveFieldLabel(key: string): string {
  return (
    AUDIT_DETAIL_LABELS[key] ??
    (key.endsWith('Label') ? AUDIT_DETAIL_LABELS[key.slice(0, -'Label'.length)] : undefined) ??
    key
  )
}

function isBlank(varValue: unknown): boolean {
  return varValue == null || varValue === '' || (Array.isArray(varValue) && varValue.length === 0)
}

/**
 * 附件字段：只展示文件名，不展示上传组件内部结构（fileId/fileUrl/签名参数）。
 * 后端可能返回 JSON 字符串或对象数组，两种形态都要兼容。
 */
function formatArchiveFiles(value: unknown): string {
  let list: unknown[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      list = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      // 非 JSON 字符串（如纯文件名）按原文展示
      return value
    }
  } else {
    list = Array.isArray(value) ? value : [value]
  }
  return list
    .map((item) => {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        return String(obj.fileName ?? obj.name ?? obj.file_name ?? '')
      }
      return item == null ? '' : String(item)
    })
    .filter((name) => name !== '')
    .join('、')
}

/** 附件字段名（后端不同接口用词不一致） */
const FILE_FIELDS = new Set([
  'proofFiles',
  'proofMaterials',
  'evidenceFiles',
  'evidence_files',
  'files',
])

/** 详情字段值 → 展示文本：枚举翻译、附件取文件名、空值显示 '-' */
export function formatArchiveValue(key: string, value: unknown): string {
  if (isBlank(value)) return '-'
  if (FILE_FIELDS.has(key)) return formatArchiveFiles(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return translateArchiveEnum(key, value) ?? String(value)
}

export interface ArchiveDetailEntry {
  key: string
  label: string
  value: unknown
}

/**
 * 详情 Map → 可展示条目：
 *  - 隐藏空值与后端内部字段；
 *  - 原始枚举码与 *Label 成对字段只保留一行（前端能翻译用原始码行，否则用中文 Label 行）；
 *  - 行标题统一中文。
 */
export function buildArchiveDetailEntries(
  details: Record<string, unknown> | null | undefined,
  skipKeys: readonly string[] = [],
): ArchiveDetailEntry[] {
  if (!details) return []
  const skip = new Set(['id', 'status', 'semesterId', 'submitTime', 'applicantId', ...skipKeys])
  return Object.entries(details)
    .filter(([key, value]) => {
      if (skip.has(key) || isBlank(value)) return false
      // 附件字段形如 "[]"、[{fileUrl}] 时实际没有可展示的文件名，按空值处理
      if (FILE_FIELDS.has(key) && formatArchiveFiles(value) === '') return false

      if (key.endsWith('Label')) {
        const baseKey = key.slice(0, -'Label'.length)
        // 基础字段可被前端字典翻译时，Label 行是重复信息
        return translateArchiveEnum(baseKey, details[baseKey]) == null
      }

      // 原始码前端无法翻译、但后端给了中文标签时，交由 *Label 行展示
      const labelValue = details[`${key}Label`]
      if (!isBlank(labelValue) && translateArchiveEnum(key, value) == null) return false
      return true
    })
    .map(([key, value]) => ({ key, label: archiveFieldLabel(key), value }))
}
