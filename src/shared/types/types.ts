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

// 职业规划
export interface CareerPlan {
  id: string
  semester: Semester
  planFile: string
  submitDate: string
  status: 'draft' | 'submitted'
}

// 短板识别结果
export interface WeaknessAnalysis {
  id: string
  dimension: string
  score: number
  weakness: string
  suggestion: string
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

// === 审批类型 ===

export interface ApprovalItem {
  id: string
  type: ApplicationType
  applicantName: string
  title: string
  submitDate: string
  status: 'pending' | 'approved' | 'rejected'
  content: any
}

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
