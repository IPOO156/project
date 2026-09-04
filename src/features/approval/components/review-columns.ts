/**
 * 申报审核 - 10 个申报类型的列定义与过滤字段配置
 */
import {
  AWARD_LEVELS,
  CERTIFICATE_TYPES,
  COMPETITION_TYPES,
  INDUSTRY_TYPES,
  INNOVATION_COMPANY_TYPES,
  ORGANIZATION_LEVELS,
  PROJECT_LEVELS,
  SCHOLARSHIP_GRADES,
  SCHOLARSHIP_LEVELS,
} from '@/shared/constants/dict'

/** 公共状态下拉选项 */
export const STATUS_FILTER_OPTIONS = [
  { label: '待审核', value: 'submitted' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
] as const

/** 表格列定义 */
export interface ColumnDef {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  dictOptions?: ReadonlyArray<{ label: string; value: string }>
  type?: 'text' | 'status' | 'date'
  showOverflowTooltip?: boolean
}

/** 过滤字段定义 */
export interface FilterFieldDef {
  key: string
  label: string
  type: 'input' | 'select' | 'daterange'
  options?: ReadonlyArray<{ label: string; value: string }>
  placeholder?: string
}

/** 单个申报类型的列与过滤配置 */
export interface TypeColumnConfig {
  label: string
  columns: ColumnDef[]
  filters: FilterFieldDef[]
}

/** 10 个申报类型的列配置索引 */
export const REVIEW_COLUMNS: Record<string, TypeColumnConfig> = {
  competition: {
    label: '学科竞赛',
    columns: [
      { prop: 'competitionName', label: '竞赛名称', minWidth: 200, showOverflowTooltip: true },
      { prop: 'competitionType', label: '竞赛类型', width: 100, dictOptions: COMPETITION_TYPES },
      { prop: 'awardLevel', label: '获奖等级', width: 100, dictOptions: AWARD_LEVELS },
      { prop: 'awardDate', label: '获奖时间', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '竞赛名称', type: 'input', placeholder: '搜索竞赛名称' },
      { key: 'competitionType', label: '竞赛类型', type: 'select', options: COMPETITION_TYPES },
      { key: 'awardLevel', label: '获奖等级', type: 'select', options: AWARD_LEVELS },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  innovation: {
    label: '创新创业',
    columns: [
      { prop: 'companyName', label: '公司/项目名称', minWidth: 200, showOverflowTooltip: true },
      { prop: 'industryType', label: '行业类型', width: 110, dictOptions: INDUSTRY_TYPES },
      { prop: 'companyType', label: '企业类型', width: 110, dictOptions: INNOVATION_COMPANY_TYPES },
      { prop: 'teamRole', label: '团队角色', width: 100 },
      { prop: 'registerDate', label: '注册时间', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '项目名称', type: 'input', placeholder: '搜索项目名称' },
      { key: 'industryType', label: '行业类型', type: 'select', options: INDUSTRY_TYPES },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  research: {
    label: '学术研究',
    columns: [
      { prop: 'projectName', label: '项目名称', minWidth: 200, showOverflowTooltip: true },
      { prop: 'projectLevel', label: '项目级别', width: 100, dictOptions: PROJECT_LEVELS },
      { prop: 'researchType', label: '研究类型', minWidth: 130 },
      { prop: 'teamRole', label: '团队角色', width: 100 },
      { prop: 'projectDate', label: '项目时间', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '项目名称', type: 'input', placeholder: '搜索项目名称' },
      { key: 'projectLevel', label: '项目级别', type: 'select', options: PROJECT_LEVELS },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  scholarship: {
    label: '奖学金',
    columns: [
      { prop: 'awardName', label: '奖学金名称', minWidth: 200, showOverflowTooltip: true },
      {
        prop: 'scholarshipLevel',
        label: '奖学金等级',
        width: 130,
        dictOptions: SCHOLARSHIP_LEVELS,
      },
      {
        prop: 'scholarshipGrade',
        label: '奖学金级别',
        width: 110,
        dictOptions: SCHOLARSHIP_GRADES,
      },
      { prop: 'acquireDate', label: '获得时间', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '奖学金名称', type: 'input', placeholder: '搜索奖学金名称' },
      { key: 'scholarshipLevel', label: '奖学金等级', type: 'select', options: SCHOLARSHIP_LEVELS },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  certificate: {
    label: '荣誉证书',
    columns: [
      { prop: 'certName', label: '证书名称', minWidth: 200, showOverflowTooltip: true },
      { prop: 'certType', label: '证书类型', width: 110, dictOptions: CERTIFICATE_TYPES },
      { prop: 'certDate', label: '获得日期', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '证书名称', type: 'input', placeholder: '搜索证书名称' },
      { key: 'certType', label: '证书类型', type: 'select', options: CERTIFICATE_TYPES },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  internship: {
    label: '实习经历',
    columns: [
      { prop: 'company', label: '公司名称', minWidth: 180, showOverflowTooltip: true },
      { prop: 'position', label: '职位', width: 130 },
      { prop: 'location', label: '地点', width: 120 },
      { prop: 'startDate', label: '开始时间', width: 120 },
      { prop: 'endDate', label: '结束时间', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '公司名称', type: 'input', placeholder: '搜索公司名称' },
      { key: 'position', label: '职位', type: 'input', placeholder: '搜索职位' },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  organization: {
    label: '组织履历',
    columns: [
      { prop: 'department', label: '部门名称', minWidth: 180, showOverflowTooltip: true },
      { prop: 'position', label: '职务', width: 130 },
      {
        prop: 'organizationLevel',
        label: '组织级别',
        width: 100,
        dictOptions: ORGANIZATION_LEVELS,
      },
      { prop: 'startDate', label: '开始时间', width: 120 },
      { prop: 'endDate', label: '结束时间', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '部门名称', type: 'input', placeholder: '搜索部门名称' },
      { key: 'position', label: '职务', type: 'input', placeholder: '搜索职务' },
      { key: 'organizationLevel', label: '组织级别', type: 'select', options: ORGANIZATION_LEVELS },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  training: {
    label: '实训项目',
    columns: [
      { prop: 'projectName', label: '项目名称', minWidth: 200, showOverflowTooltip: true },
      { prop: 'projectContent', label: '实训内容', minWidth: 200, showOverflowTooltip: true },
      { prop: 'startDate', label: '开始时间', width: 120 },
      { prop: 'endDate', label: '结束时间', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '项目名称', type: 'input', placeholder: '搜索项目名称' },
      { key: 'projectContent', label: '实训内容', type: 'input', placeholder: '搜索内容' },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  socialPractice: {
    label: '社会实践',
    columns: [
      { prop: 'activityName', label: '活动名称', minWidth: 200, showOverflowTooltip: true },
      { prop: 'location', label: '地点', width: 130 },
      { prop: 'organization', label: '组织单位', minWidth: 160, showOverflowTooltip: true },
      { prop: 'startDate', label: '开始时间', width: 120 },
      { prop: 'endDate', label: '结束时间', width: 120 },
      { prop: 'volunteerHours', label: '志愿时长(小时)', width: 130 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '活动名称', type: 'input', placeholder: '搜索活动名称' },
      { key: 'location', label: '地点', type: 'input', placeholder: '搜索地点' },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
  bookReport: {
    label: '图书心得',
    columns: [
      { prop: 'bookName', label: '书名', minWidth: 200, showOverflowTooltip: true },
      { prop: 'bookDate', label: '阅读日期', width: 120 },
      { prop: 'submitDate', label: '提交日期', width: 120 },
      { prop: 'semester', label: '学期', width: 110 },
      { prop: 'status', label: '状态', width: 100, type: 'status' },
    ],
    filters: [
      { key: 'keyword', label: '书名', type: 'input', placeholder: '搜索书名' },
      { key: 'status', label: '状态', type: 'select', options: STATUS_FILTER_OPTIONS },
    ],
  },
}

/** 10 个申报类型的 key 列表（排除之星类型） */
export const DECLARATION_TYPE_KEYS = [
  'competition',
  'innovation',
  'research',
  'scholarship',
  'certificate',
  'internship',
  'organization',
  'training',
  'socialPractice',
  'bookReport',
] as const

/** 申报类型的中文映射 */
export const DECLARATION_TYPE_LABELS: Record<string, string> = {
  competition: '学科竞赛',
  innovation: '创新创业',
  research: '学术研究',
  scholarship: '奖学金',
  certificate: '荣誉证书',
  internship: '实习经历',
  organization: '组织履历',
  training: '实训项目',
  socialPractice: '社会实践',
  bookReport: '图书心得',
}
