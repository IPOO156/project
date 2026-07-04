// 各申报模块的中文映射
export const APPLICATION_TYPE_MAP: Record<string, string> = {
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
  competitionStar: '竞赛之星报名',
  innovationStar: '双创之星报名',
  scientificProject: '科研项目',
  softwareCopyright: '科研之星-软著',
  paper: '科研之星-论文',
}

const TERM_LABELS = ['一', '二', '三'] as const

function generateSemesterOptions(startYear: number, endYear: number) {
  const options: { label: string; value: string }[] = []
  for (let year = startYear; year < endYear; year++) {
    for (let term = 0; term < TERM_LABELS.length; term++) {
      const value = `${year}-${year + 1}-${term + 1}`
      options.push({
        label: `${year}-${year + 1}第${TERM_LABELS[term]}学期`,
        value,
      })
    }
  }
  return options
}

// 学期选项：学年-学期格式，如 2024-2025第一学期
export const SEMESTER_OPTIONS = generateSemesterOptions(2022, 2028)

// 申请状态（含标签颜色）
export const APPLICATION_STATUS = {
  draft: { label: '草稿', color: 'info' },
  submitted: { label: '已提交', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'danger' },
} as const

// 通知分类（消息中心使用）
export const NOTIFICATION_CATEGORY = {
  system: { label: '系统通知', color: 'primary' },
  approval: { label: '审批提醒', color: 'warning' },
  activity: { label: '动态提醒', color: 'success' },
  message: { label: '私信', color: 'info' },
} as const

// 通知状态
export const NOTIFICATION_STATUS = {
  read: { label: '已读', color: 'info' },
  unread: { label: '未读', color: 'primary' },
} as const

// 审批状态筛选选项
export const APPROVAL_STATUS_OPTIONS = [
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '待审批', value: 'pending' },
] as const

// 竞赛类型
export const COMPETITION_TYPES = [
  { label: '国家级', value: 'national' },
  { label: '省部级', value: 'provincial' },
  { label: '校级', value: 'school' },
  { label: '院级', value: 'college' },
] as const

// 获奖等级
export const AWARD_LEVELS = [
  { label: '一等奖', value: 'first' },
  { label: '二等奖', value: 'second' },
  { label: '三等奖', value: 'third' },
  { label: '优秀奖', value: 'excellence' },
  { label: '特等奖', value: 'special' },
] as const

// 项目级别
export const PROJECT_LEVELS = [
  { label: '国家级', value: 'national' },
  { label: '省部级', value: 'provincial' },
  { label: '校级', value: 'school' },
  { label: '院级', value: 'college' },
] as const

// 证书类型
export const CERTIFICATE_TYPES = [
  { label: '技能证书', value: 'skill' },
  { label: '语言证书', value: 'language' },
  { label: '专业证书', value: 'professional' },
  { label: '其他', value: 'other' },
] as const

// 组织级别
export const ORGANIZATION_LEVELS = [
  { label: '校级', value: 'school' },
  { label: '院级', value: 'college' },
  { label: '社团级', value: 'club' },
  { label: '班级', value: 'class' },
] as const

// 行业类型
export const INDUSTRY_TYPES = [
  { label: '信息技术', value: 'it' },
  { label: '教育培训', value: 'education' },
  { label: '文化传媒', value: 'media' },
  { label: '商贸服务', value: 'business' },
  { label: '其他', value: 'other' },
] as const

// 奖学金级别（一/二/三等奖）
export const SCHOLARSHIP_GRADES = [
  { label: '一等奖', value: 'first' },
  { label: '二等奖', value: 'second' },
  { label: '三等奖', value: 'third' },
] as const

// 创新创业企业类型
export const INNOVATION_COMPANY_TYPES = [
  { label: '创业实践', value: '创业实践' },
  { label: '创业计划', value: '创业计划' },
  { label: '实体注册', value: '实体注册' },
  { label: '其他', value: '其他' },
] as const

// 奖学金等级
export const SCHOLARSHIP_LEVELS = [
  { label: '国家奖学金', value: 'national' },
  { label: '省级奖学金', value: 'provincial' },
  { label: '校级奖学金', value: 'school' },
  { label: '院级奖学金', value: 'college' },
  { label: '企业奖学金', value: 'enterprise' },
] as const

// 成长时间轴事件类型
export const TIMELINE_EVENT_TYPES = {
  award: { label: '奖项', color: '#e6a23c', iconKey: 'Award' },
  practice: { label: '实践', color: '#67c23a', iconKey: 'Users' },
  grade: { label: '成绩', color: '#409eff', iconKey: 'BookOpen' },
  competition: { label: '竞赛', color: '#9b59b6', iconKey: 'Code' },
  internship: { label: '实习', color: '#f56c6c', iconKey: 'Briefcase' },
  other: { label: '其他', color: '#909399', iconKey: 'Star' },
} as const

// 个人兴趣掌握程度
export const INTEREST_LEVEL = {
  proficient: { label: '熟练', color: 'success' },
  good: { label: '良好', color: 'warning' },
  general: { label: '一般', color: 'info' },
} as const

// 最近动态类型
export const ACTIVITY_STATUS = {
  submitted: { label: '已提交', color: '#e6a23c' },
  approved: { label: '已通过', color: '#67c23a' },
  rejected: { label: '需修改', color: '#f56c6c' },
} as const
