/**
 * 业务下拉字典常量。
 *
 * 取值与后端 `dictionaries` 表（D:\StudentArchives\sql\seed_dictionaries.sql）保持一致，
 * 用于「后端字典优先、常量兜底」的 fallback，禁止再按 UI 文案自行编造 value。
 *
 * 说明：
 * - 后端接口 GET /common/dict?dictType=xxx 返回启用项时，页面以后端为准；
 * - 接口失败或返回空数组时，才使用本文件的常量兜底；
 * - legacy 映射只用于旧数据展示，不进入可选下拉，避免已停用值被重新提交。
 */

export interface DictChoice {
  label: string
  value: string
}

type DictChoiceList = readonly DictChoice[]

/** 竞赛级别（后端 dictType: competition_level，竞赛之星使用） */
export const COMPETITION_LEVELS = [
  { label: '国家级', value: 'national' },
  { label: '省部级', value: 'provincial' },
  { label: '校级', value: 'school' },
  { label: '院级', value: 'college' },
] as const

/** 竞赛类型（后端 dictType: competition_type，学科竞赛申报使用） */
export const COMPETITION_TYPES = [
  { label: '学科类', value: 'academic' },
  { label: '科技类', value: 'technology' },
  { label: '创新创业类', value: 'innovation' },
  { label: '文艺类', value: 'art' },
  { label: '体育类', value: 'sports' },
  { label: '其他', value: 'other' },
] as const

/** 获奖等级（后端 dictType: award_level） */
export const AWARD_LEVELS = [
  { label: '特等奖', value: 'special' },
  { label: '一等奖', value: 'first' },
  { label: '二等奖', value: 'second' },
  { label: '三等奖', value: 'third' },
  { label: '优秀奖', value: 'excellence' },
] as const

/** 项目级别（后端 dictType: project_level） */
export const PROJECT_LEVELS = [
  { label: '国家级', value: 'national' },
  { label: '省部级', value: 'provincial' },
  { label: '校级', value: 'school' },
  { label: '院级', value: 'college' },
] as const

/** 研究类型（后端 dictType: research_type，中文或旧码会与后端字典失配） */
export const RESEARCH_TYPES = [
  { label: '基础研究', value: 'basic' },
  { label: '应用研究', value: 'applied' },
  { label: '实验发展', value: 'experimental' },
  { label: '其他', value: 'other' },
] as const

/** 证书类型：后端无 certificate_type 字典，学生端为自由文本，本常量仅供教师端展示映射 */
export const CERTIFICATE_TYPES = [
  { label: '技能证书', value: 'skill' },
  { label: '语言证书', value: 'language' },
  { label: '专业证书', value: 'professional' },
  { label: '其他', value: 'other' },
] as const

/** 组织级别（后端 dictType: organization_level） */
export const ORGANIZATION_LEVELS = [
  { label: '校级', value: 'school' },
  { label: '院级', value: 'college' },
  { label: '系级', value: 'department' },
  { label: '其他', value: 'other' },
] as const

/** 行业类型（后端 dictType: industry_type，双创之星使用） */
export const INDUSTRY_TYPES = [
  { label: '互联网/信息技术', value: 'internet' },
  { label: '金融', value: 'finance' },
  { label: '教育/培训', value: 'education' },
  { label: '制造业', value: 'manufacturing' },
  { label: '医疗健康', value: 'medical' },
  { label: '房地产/建筑', value: 'real_estate' },
  { label: '能源/环保', value: 'energy' },
  { label: '农林牧渔', value: 'agriculture' },
  { label: '文化传媒', value: 'culture' },
  { label: '咨询/商务服务', value: 'consulting' },
  { label: '其他', value: 'other' },
] as const

/** 奖学金获奖等级（后端 dictType: scholarship_award_level） */
export const SCHOLARSHIP_GRADES = [
  { label: '特等奖', value: 'special' },
  { label: '一等奖', value: 'first' },
  { label: '二等奖', value: 'second' },
  { label: '三等奖', value: 'third' },
] as const

/** 创新创业企业类型（后端 dictType: company_type） */
export const INNOVATION_COMPANY_TYPES = [
  { label: '有限责任公司', value: 'limited_liability' },
  { label: '股份有限公司', value: 'joint_stock' },
  { label: '合伙企业', value: 'partnership' },
  { label: '个体工商户', value: 'sole_proprietorship' },
  { label: '其他', value: 'other' },
] as const

/** 奖学金级别（后端 dictType: scholarship_level） */
export const SCHOLARSHIP_LEVELS = [
  { label: '国家奖学金', value: 'national' },
  { label: '省级奖学金', value: 'provincial' },
  { label: '校级奖学金', value: 'school' },
  { label: '企业奖学金', value: 'enterprise' },
] as const

/** 政治面貌兜底（后端 dictType: political_status） */
export const POLITICAL_STATUS_OPTIONS = [
  { label: '中共党员', value: 'party_member' },
  { label: '中共预备党员', value: 'party_member_pre' },
  { label: '共青团员', value: 'league_member' },
  { label: '群众', value: 'masses' },
  { label: '民主党派', value: 'other_party' },
] as const

/* ===================== 旧数据展示映射（不进入可选下拉） ===================== */

/** 旧数据曾把竞赛级别码写进 competition_type 字段 */
export const LEGACY_COMPETITION_TYPES: Record<string, string> = {
  national: '国家级',
  provincial: '省部级',
  school: '校级',
  college: '院级',
}

/** 旧研究类型码 development 已替换为后端 experimental */
export const LEGACY_RESEARCH_TYPES: Record<string, string> = {
  development: '实验发展',
}

/** 旧组织级别码 */
export const LEGACY_ORGANIZATION_LEVELS: Record<string, string> = {
  club: '社团级',
  class: '班级',
}

/** 旧行业类型码 */
export const LEGACY_INDUSTRY_TYPES: Record<string, string> = {
  it: '信息技术',
  media: '文化传媒',
  business: '商贸服务',
}

/** 旧奖学金级别码（后端 seed 已无院级） */
export const LEGACY_SCHOLARSHIP_LEVELS: Record<string, string> = {
  college: '院级奖学金',
}

/** 旧企业类型存的是中文业务阶段值，与后端法律主体类型语义不同，仅原样展示 */
export const LEGACY_COMPANY_TYPES: Record<string, string> = {
  创业实践: '创业实践',
  创业计划: '创业计划',
  实体注册: '实体注册',
}

/** canonical + legacy 去重合并，供查看/表格展示；过滤与编辑仍使用 canonical */
function mergeDisplayOptions(base: DictChoiceList, legacy: Record<string, string>): DictChoice[] {
  const seen = new Set(base.map((item) => item.value))
  const extras = Object.entries(legacy)
    .filter(([value]) => !seen.has(value))
    .map(([value, label]) => ({ value, label }))
  return [...base, ...extras]
}

export const COMPETITION_TYPE_DISPLAY_OPTIONS = mergeDisplayOptions(
  COMPETITION_TYPES,
  LEGACY_COMPETITION_TYPES,
)

export const RESEARCH_TYPE_DISPLAY_OPTIONS = mergeDisplayOptions(
  RESEARCH_TYPES,
  LEGACY_RESEARCH_TYPES,
)

export const ORGANIZATION_LEVEL_DISPLAY_OPTIONS = mergeDisplayOptions(
  ORGANIZATION_LEVELS,
  LEGACY_ORGANIZATION_LEVELS,
)

export const INDUSTRY_TYPE_DISPLAY_OPTIONS = mergeDisplayOptions(
  INDUSTRY_TYPES,
  LEGACY_INDUSTRY_TYPES,
)

export const SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS = mergeDisplayOptions(
  SCHOLARSHIP_LEVELS,
  LEGACY_SCHOLARSHIP_LEVELS,
)

export const COMPANY_TYPE_DISPLAY_OPTIONS = mergeDisplayOptions(
  INNOVATION_COMPANY_TYPES,
  LEGACY_COMPANY_TYPES,
)
