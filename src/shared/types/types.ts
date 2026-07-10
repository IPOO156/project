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
}

// 个人兴趣
export interface Interest {
  id: string
  category: string
  content: string
  level: string
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
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
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
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  sourcePath: string
}

// 职业规划记录
export interface CareerPlanRecord {
  id: string
  semester: string
  title: string
  submitDate: string
  status: 'draft' | 'submitted'
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
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
}

export interface ActivityFilters {
  keyword?: string
  status?: string
}

// === 消息中心 ===

export type NotificationCategory = 'system' | 'approval' | 'activity' | 'message'

export type NotificationStatus = 'read' | 'unread'

export interface Notification {
  id: string
  title: string
  content: string
  category: NotificationCategory
  status: NotificationStatus
  isRead: boolean
  createdAt: string
  link?: string
  sender?: string
}

export interface NotificationFilters {
  category?: NotificationCategory
  status?: NotificationStatus
  keyword?: string
}
