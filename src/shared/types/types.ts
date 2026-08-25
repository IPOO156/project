// 通用响应结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页请求参数
export interface PaginationParams {
  pageNum: number
  pageSize: number
  [key: string]: any
}

// 分页响应结构
export interface PaginatedData<T = any> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

// 字典选项
export interface DictOption {
  label: string
  value: string | number
  color?: string
}

// 学期：学年-学期格式，如 2024-2025-1
export type Semester = string

// === 角色与权限 ===

/** 教师端角色枚举 */
export type TeacherRole = 'super_admin' | 'admin' | 'reviewer' | 'teacher'

/** 角色中文名映射 */
export const TEACHER_ROLE_LABELS: Record<TeacherRole, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  reviewer: '审核员',
  teacher: '课任教师',
}

/** 角色可访问的模块 key */
export const ROLE_PERMISSIONS: Record<TeacherRole, string[]> = {
  super_admin: [
    'material-review',
    'archive-export',
    'role-selection',
    'form-customization',
    'account-management',
    'archive-view',
    'system-maintenance',
    'info-security',
    'log-view',
    'heat-map',
    'ability-dimension',
    'score-recalculate',
    'export-template',
    'indicator',
    'approval-flow',
    'system-management',
  ],
  admin: [
    'material-review',
    'archive-export',
    'role-selection',
    'form-customization',
    'log-view',
    'heat-map',
    'account-management',
    'archive-view',
    'ability-dimension',
    'score-recalculate',
    'export-template',
    'indicator',
    'approval-flow',
    'system-management',
  ],
  reviewer: ['material-review', 'log-view', 'heat-map'],
  teacher: ['archive-view', 'archive-export', 'log-view', 'heat-map'],
}

// === 学生端核心类型 ===

// 用户信息
export interface UserInfo {
  id: string
  username: string
  realName: string
  avatar?: string
  studentId: string
  grade: string
  major: string
  className: string
  email: string
  phone: string
  /** 教师端角色（学生端无此字段） */
  role?: TeacherRole
  /** 所属学院 */
  college?: string
  /** 所属院系 */
  department?: string
  /** 登录类型 */
  loginType?: 'student' | 'teacher'
}

// 个人兴趣（字段对齐 PUT /profile/interests 与 GET /profile/info.interests）
export interface Interest {
  id: number
  tagName: string
  proficiencyLevel: number
  detailContent: string
  isDetail?: number
}

// 多维度画像（后端返回 current/target/previous，color 由前端按主题派生）
export interface ProfileDimension {
  label: string
  current: number
  target: number
  previous: number
}

// 成绩与绩点
export interface Grade {
  id: string
  semester: string
  courseName: string
  score: number
  gpa: number
  credits: number
}

// 奖项
export interface Award {
  id: string
  name: string
  level: string
  type: string
  date: string
  prize?: string
  description?: string
  proof?: string
}

// 成长时间轴节点
export interface TimelineNode {
  id: string
  semester: Semester
  type: 'award' | 'practice' | 'grade' | 'competition' | 'internship' | 'other'
  title: string
  description: string
  date: string
  recordId?: string
}

// 职业规划记录（实际使用 CareerPlanRecord，见下文）
// CareerPlan 为历史遗留，保留以兼容

// === 审核类型 ===

// 申报审核记录（支持 10 种申报类型的字段索引签名）
export interface ReviewRecord {
  id: string
  type: string
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  status: string // draft | submitted | approved | rejected
  proofMaterials: string[]
  [key: string]: any
}

// 奖项审核记录（之星报名：竞赛之星/科研之星/双创之星）
export interface StarRecord {
  id: string
  type: string
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  status: string
  sourcePath: string
  applicant: string
  // 竞赛之星
  competitionName?: string
  competitionDate?: string
  competitionLevel?: string
  awardLevel?: string
  // 科研项目
  projectName?: string
  projectLevel?: string
  // 软著
  softName?: string
  issuer?: string
  // 论文
  paperName?: string
  journalName?: string
  // 公共
  ranking?: string
  projectDate?: string
  approveDate?: string
  publishDate?: string
  // 双创之星
  companyName?: string
  industryType?: string
  registerDate?: string
}

// === 申报模块基础类型 ===

export interface ApplicationBase {
  id: string
  semester: Semester
  status: 'draft' | 'pending' | 'rejected' | 'approved' | 'withdrawn'
  submitDate: string
  proofMaterials: string[]
  remark?: string
}

// 学科竞赛
export interface Competition extends ApplicationBase {
  competitionName: string
  competitionType: string
  awardLevel: string
  awardDate: string
}

// 创新创业
export interface Innovation extends ApplicationBase {
  companyName: string
  industryType: string
  companyType: string
  teamRole: string
  registerDate: string
}

// 学术研究
export interface AcademicResearch extends ApplicationBase {
  projectName: string
  projectLevel: string
  researchType: string
  teamRole: string
  projectDate: string
}

// 奖学金
export interface Scholarship extends ApplicationBase {
  awardName: string
  scholarshipLevel: string
  scholarshipGrade: string
  acquireDate: string
}

// 荣誉证书
export interface HonorCertificate extends ApplicationBase {
  certType: string
  certName: string
  certDate: string
}

// 实习经历
export interface Internship extends ApplicationBase {
  company: string
  location: string
  position: string
  startDate: string
  endDate: string
}

// 组织履历
export interface OrganizationExp extends ApplicationBase {
  organizationLevel: string
  department: string
  position: string
  startDate: string
  endDate: string
}

// 实训项目
export interface TrainingProject extends ApplicationBase {
  projectName: string
  projectContent: string
  startDate: string
  endDate: string
}

// 社会实践
export interface SocialPractice extends ApplicationBase {
  activityName: string
  location: string
  organization: string
  startDate: string
  endDate: string
  volunteerHours: number
}

// 图书心得
export interface BookReport extends ApplicationBase {
  bookName: string
  bookDate: string
  review?: string
}

// 竞赛之星报名
export interface CompetitionStar extends ApplicationBase {
  competitionName: string
  competitionDate: string
  competitionLevel: string
  awardLevel: string
}

// 科研项目
export interface ScientificProject extends ApplicationBase {
  projectName: string
  projectLevel: string
  ranking: string
  projectDate: string
}

// 科研之星 - 软著
export interface SoftwareCopyright extends ApplicationBase {
  softName: string
  issuer: string
  ranking: string
  approveDate: string
}

// 科研之星 - 论文
export interface Paper extends ApplicationBase {
  journalName: string
  paperName: string
  ranking: string
  publishDate: string
}

// 双创之星报名
export interface InnovationStar extends ApplicationBase {
  companyName: string
  industryType: string
  ranking: string
  registerDate: string
}

// === 提交与筛选 ===

export type ApplicationType =
  | 'competition'
  | 'innovation'
  | 'research'
  | 'scholarship'
  | 'certificate'
  | 'internship'
  | 'organization'
  | 'training'
  | 'socialPractice'
  | 'bookReport'
  | 'competitionStar'
  | 'innovationStar'
  | 'scientificProject'
  | 'softwareCopyright'
  | 'paper'

// 提交记录
export interface SubmissionRecord {
  id: string
  type: ApplicationType
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  status: 'draft' | 'pending' | 'rejected' | 'approved' | 'withdrawn'
  sourcePath: string
}

// 职业规划记录
export interface CareerPlanRecord {
  id: string
  semester: string
  title: string
  submitDate: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn'
  /** 完成进度（后端 progressRate，0-100），后端未返回时无此字段 */
  progressRate?: number
  /** 后端返回的状态文案（statusLabel） */
  statusLabel?: string
}

// AI 职业规划短板分析结果（AI 助手生成 → 写入 store → 职业规划页渲染）
export interface WeaknessItem {
  /** 维度名称（如"科研创新"） */
  dimension: string
  /** 当前分数 */
  score: number
  /** 目标分数 */
  target: number
  /** 差距 = target - current */
  gap: number
  /** 短板描述（基于真实数据生成，如"60 分，差 22 分，0 项科研类成果"） */
  weakness: string
  /** 改进建议（基于真实数据生成） */
  suggestion: string
}

export interface CareerAnalysis {
  /** 问候语 */
  greeting: string
  /** 总体摘要（如"共分析 5 个维度，其中 2 个差距较大"） */
  summary: string
  /** 短板列表（按差距降序） */
  weaknesses: WeaknessItem[]
  /** 本次分析引用的档案材料（如"多维度画像（5 项）"） */
  materials?: string[]
  /** 生成时间 */
  generatedAt: string
}

// 提交记录筛选条件
export interface SubmissionFilters {
  keyword?: string
  type?: string
  status?: string
  dateRange?: [string | undefined, string | undefined]
}

// === 最近动态 ===

export interface Activity {
  id: string
  type: 'draft' | 'submitted' | 'approved' | 'rejected'
  text: string
  time: string
  status: 'draft' | 'pending' | 'rejected' | 'approved' | 'withdrawn'
}

export interface ActivityFilters {
  keyword?: string
  status?: string
}

// === 消息中心 ===

/** 消息分类（user_messages.category，与后端字典一致） */
export type NotificationCategory =
  'system_notice' | 'audit_remind' | 'dynamic_remind' | 'private_message'

export type NotificationStatus = 'read' | 'unread'

/** 消息记录（user_messages 表，字段与后端 /messages 响应一致） */
export interface Notification {
  id: string
  category: NotificationCategory
  categoryLabel: string
  title: string
  content: string
  senderType?: number
  senderTypeLabel?: string
  senderName?: string | null
  isRead: number
  readAt?: string | null
  isImportant?: number
  isArchived?: number
  archivedAt?: string | null
  deadline?: string | null
  jumpUrl?: string | null
  sendChannel?: string
  relatedType?: string | null
  relatedId?: number | null
  createdAt: string
  /** 派生：是否已读（isRead === 1） */
  isReadFlag: boolean
}

export interface NotificationFilters {
  category?: NotificationCategory
  status?: NotificationStatus
  keyword?: string
  archived?: boolean
}
