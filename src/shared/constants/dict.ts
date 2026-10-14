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

const TERM_LABELS = ['一', '二'] as const

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

// 本人角色
export const ROLE_OPTIONS = [
  { label: '负责人', value: 'leader' },
  { label: '成员', value: 'member' },
  { label: '独立完成', value: 'individual' },
] as const

// 申请状态（含标签颜色）
export const APPLICATION_STATUS = {
  draft: { label: '草稿', color: 'info' },
  pending: { label: '待审核', color: 'warning' },
  rejected: { label: '已驳回', color: 'danger' },
  approved: { label: '已通过', color: 'success' },
  withdrawn: { label: '已撤销', color: 'info' },
} as const

// 通知分类（user_messages.category，与后端字典一致）
export const NOTIFICATION_CATEGORY = {
  system_notice: { label: '系统通知', color: 'info' },
  audit_remind: { label: '审批提醒', color: 'warning' },
  dynamic_remind: { label: '动态提醒', color: 'success' },
  private_message: { label: '私信', color: 'primary' },
} as const

// 通知状态
export const NOTIFICATION_STATUS = {
  unread: { label: '未读', color: 'primary' },
  read: { label: '已读', color: 'info' },
  archived: { label: '已归档', color: 'default' },
} as const

// 审批状态筛选选项
export const APPROVAL_STATUS_OPTIONS = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已撤销', value: 'withdrawn' },
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

// 研究类型（后端 /applications/research 的 projectType 枚举码，中文会返回 10003 格式错误）
export const RESEARCH_TYPES = [
  { label: '基础研究', value: 'basic' },
  { label: '应用研究', value: 'applied' },
  { label: '试验发展', value: 'development' },
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

// 个人兴趣掌握程度（proficiencyLevel：1=入门 2=一般 3=熟练 4=精通，见接口文档 §4.11）
export const INTEREST_LEVEL: Record<string, { label: string; color?: string }> = {
  '1': { label: '入门', color: 'info' },
  '2': { label: '一般', color: 'warning' },
  '3': { label: '熟练', color: 'primary' },
  '4': { label: '精通', color: 'success' },
}

// 最近动态类型
export const ACTIVITY_STATUS = {
  submitted: { label: '已提交', color: '#e6a23c' },
  approved: { label: '已通过', color: '#67c23a' },
  rejected: { label: '需修改', color: '#f56c6c' },
  withdrawn: { label: '已撤销', color: '#909399' },
  correction: { label: '更正申请', color: '#409eff' },
} as const

// 日志操作类型（管理员端日志查看模块使用，LogView 与 LogTable 共用）
// action 取值对齐后端 audit_logs.action（create/update/delete/audit 等）
export type LogActionTag = 'success' | 'warning' | 'danger' | 'info' | 'primary'
export const LOG_ACTION_TYPES: Record<string, { label: string; tag: LogActionTag }> = {
  create: { label: '新增', tag: 'success' },
  update: { label: '修改', tag: 'warning' },
  delete: { label: '删除', tag: 'danger' },
  review: { label: '审核', tag: 'primary' },
  audit: { label: '审核', tag: 'primary' },
  login: { label: '登录', tag: 'info' },
  logout: { label: '登出', tag: 'info' },
  export: { label: '导出', tag: 'info' },
}

// 日志业务模块映射（后端 system_logs.module）
export const LOG_MODULES: Record<string, string> = {
  archive: '档案',
  award: '奖项',
  indicator: '指标',
  score: '成绩',
  career_plan: '职业规划',
  user: '账号',
  permission: '权限',
  message: '消息',
  system: '系统',
  export: '导出',
}

// 通用启用/禁用状态（管理端字典项/角色/学期启停使用，对应后端 status：1 启用 / 0 禁用）
export const COMMON_STATUS: Record<number, { label: string; tag: 'success' | 'danger' }> = {
  1: { label: '启用', tag: 'success' },
  0: { label: '禁用', tag: 'danger' },
}

// 审核业务类型（/teacher/audits 的 type，与后端 approvableType 归一化值对应）
export const AUDIT_BUSINESS_TYPES: Record<string, string> = {
  archive: '档案申报',
  award: '奖项报名',
  career_plan: '职业规划',
}

// 审核动作（AuditActionEnum：1通过 2退回 3撤回 4转交）
export const AUDIT_ACTIONS: Record<
  number,
  { label: string; tag: 'success' | 'danger' | 'info' | 'warning' }
> = {
  1: { label: '通过', tag: 'success' },
  2: { label: '退回', tag: 'danger' },
  3: { label: '撤回', tag: 'info' },
  4: { label: '转交', tag: 'warning' },
}

// 审核详情「填报内容」动态字段 key → 中文名（表单自定义字段可能超出此表，未命中则原样显示 key）
export const AUDIT_DETAIL_LABELS: Record<string, string> = {
  // 通用 / 基础信息
  semester: '学期',
  semesterName: '学期',
  obtainTime: '取得时间',
  certificateNo: '证书编号',
  issuingUnit: '发证单位',
  validUntil: '有效期至',
  participantRole: '本人角色',
  participantRoleLabel: '本人角色',
  // 竞赛 / 学科竞赛
  competitionName: '竞赛名称',
  competitionLevel: '竞赛级别',
  competitionType: '竞赛类型',
  competitionDate: '参赛时间',
  awardLevel: '获奖等级',
  awardDate: '获奖时间',
  awardName: '奖项名称',
  prizeName: '奖项名称',
  // 创新创业
  projectName: '项目名称',
  projectLevel: '项目级别',
  projectContent: '项目内容',
  companyName: '公司名称',
  companyType: '公司类型',
  industryType: '行业类型',
  teamRole: '团队角色',
  registerDate: '注册时间',
  projectDate: '项目时间',
  // 奖学金 / 科研
  scholarshipLevel: '奖学金级别',
  scholarshipGrade: '获奖等级',
  journalName: '期刊名称',
  paperName: '论文名称',
  ranking: '排名/总人数',
  publishDate: '发表时间',
  softName: '软著名称',
  issuer: '颁发单位',
  approveDate: '获批时间',
  // 证书
  certType: '证书类型',
  certName: '证书名称',
  certDate: '获得时间',
  certNumber: '证书编号',
  issuingAuthority: '发证单位',
  acquisitionDate: '取得时间',
  validityPeriod: '有效期',
  // 实习 / 社会实践 / 图书心得
  company: '实习单位',
  location: '实习地点',
  position: '实习岗位',
  startDate: '开始时间',
  endDate: '结束时间',
  organizationLevel: '组织级别',
  department: '部门',
  activityName: '活动名称',
  organization: '组织单位',
  volunteerHours: '志愿时长',
  bookName: '图书名称',
  bookDate: '阅读时间',
  review: '心得体会',
  role: '本人角色',
  title: '标题',
}

// 学生状态选项（字典编码枚举值来自接口文档 4.1.5.1，禁止前端自行增改）
export const STUDENT_STATUS_OPTIONS = [
  { value: 'current', label: '在校生' },
  { value: 'fresh_graduate', label: '应届毕业生' },
  { value: 'graduated', label: '已毕业' },
] as const

// 成长经历标签 → 主题色（成长时间轴卡片类型指示色，按标签包含关系匹配）
export const GROWTH_TAG_COLORS: Record<string, string> = {
  竞赛: '#d4a574',
  科研: '#8b6340',
  实践: '#a67c52',
  学业: '#5a7c5a',
  技术: '#9a8474',
}

// 申报状态码（后端 0-4）→ APPLICATION_STATUS key
export const APPLICATION_STATUS_CODE_MAP: Record<number, keyof typeof APPLICATION_STATUS> = {
  0: 'draft',
  1: 'pending',
  2: 'approved',
  3: 'rejected',
  4: 'withdrawn',
}

// 申报审核状态筛选项（审核列表 status 过滤，submitted 即待审核）
export const REVIEW_STATUS_FILTER_OPTIONS = [
  { label: '待审核', value: 'submitted' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
] as const

// 组织层级（2 学院 / 3 专业 / 4 班级，对应后端 scope 组织类型码）
export const ORG_TYPE_OPTIONS = [
  { value: 2, label: '学院' },
  { value: 3, label: '专业' },
  { value: 4, label: '班级' },
] as const

// 职业规划行动项状态
export const CAREER_ACTION_STATUS_OPTIONS = [
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
] as const

// 教师端成长时间轴事件类型筛选（eventType 码，'' 为全部）
export const TEACHER_EVENT_TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 1, label: '奖项' },
  { value: 2, label: '成绩' },
  { value: 3, label: '实践' },
  { value: 4, label: '职业规划' },
  { value: 5, label: '短板改进' },
  { value: 6, label: '能力提升' },
] as const

// 研究数据导出类型（/admin/exports/research 的 dataTypes）
export const RESEARCH_DATA_TYPE_OPTIONS = [
  { value: 'archives', label: '档案' },
  { value: 'scores', label: '成绩' },
  { value: 'audits', label: '审核' },
  { value: 'ai', label: 'AI 分析' },
  { value: 'career', label: '职业规划' },
] as const

// 教师改进建议类型（≤50 字，此处为常用预设项）
export const SUGGESTION_TYPE_OPTIONS = [
  '学习计划',
  '时间管理',
  '能力提升',
  '职业发展',
  '心理建设',
  '其他',
] as const

// 之星类型中文映射（奖项看板 typeDistribution key → 中文名）
export const STAR_TYPE_LABELS: Record<string, string> = {
  competition_star: '竞赛之星',
  research_star: '科研之星',
  innovation_star: '双创之星',
}

// 最近动态筛选 status → 后端数值（submitted 与 pending 均映射 1）
export const ACTIVITY_FILTER_STATUS_VALUE: Record<string, number> = {
  draft: 0,
  submitted: 1,
  pending: 1,
  approved: 2,
  rejected: 3,
  withdrawn: 4,
}
