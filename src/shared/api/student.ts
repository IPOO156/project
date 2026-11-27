import request from './request'

/* ===================== 首页模块 ===================== */

/** 首页数据概览（GET /home/dashboard） */
export interface HomeDashboard {
  studentName: string
  studentNo: string
  major: string
  className: string
  grade: string
  currentDate: string
  applicationTotal: number
  approvedCount: number
  pendingCount: number
  rejectedCount: number
  currentGpa: number
  totalCredits: number
  rankInClass: number
  rankInMajor: number
  indicators: Array<{
    dimensionCode: string
    dimensionName: string
    score: number
    /** 维度趋势，与 change 同源；无对比学期时为 null */
    trend: string | null
    targetScore: number
    gap: number
    unit: string
    comparedSemesterId?: number
    comparedSemesterName?: string
    calculationId?: number
    ruleVersion?: number
    calculatedAt?: string
  }>
  radarChart: {
    dimensions: Array<{ code: string; name: string }>
    current: number[]
    target: number[]
    previous: number[]
    /**
     * 是否存在上阶段（对比学期）数据，由当前学期评分的 compared_semester_id 推导。
     * 为 false 时 `previous` 全为「对齐维度用的补位 0」，**不代表该维度真实得分为 0**，
     * 禁止用 `current - previous` 计算环比（会得出虚高的「较上阶段 +N 分」）。
     * @JsonInclude(NON_NULL)：早期后端未下发时该字段整体缺省，按 false 处理。
     */
    hasPrevious?: boolean
  }
  dataCompleteness: { rate: number; missingItems: string[] }
  quickEntries: Array<{ name: string; icon: string; path: string; recent: boolean }>
  recentActivities: Array<{
    id: number
    title: string
    time: string
    type: string
    archiveType?: string
    status?: number
  }>
  unreadMessageCount: number
}

export function getHomeDashboard(): Promise<HomeDashboard> {
  return request.get('/home/dashboard')
}

/* ===================== 个人中心模块 ===================== */

/** 个人档案信息（GET /profile/info） */
export interface ProfileInfo {
  academicInfo: {
    userId: number
    name: string
    studentNo: string
    grade: string
    major: string
    degreeType: string
    degreeTypeLabel: string
    className: string
    collegeName: string
    gender: number
    genderLabel: string
    politicalStatus: string
    politicalStatusLabel: string
    studentStatus: string
    studentStatusLabel: string
    /** 出生日期由教务系统同步，未同步/未填写时后端返回 null */
    birthDate: string | null
  }
  contactInfo: {
    /** 本人邮箱；后端 @Sensitive 脱敏返回（如 138****1234），不可直接回填提交 */
    email: string | null
    /** 本人手机号；后端 @Sensitive 脱敏返回 */
    phone: string | null
    avatar: string | null
    address: string | null
    emergencyName: string | null
    emergencyRelation: string | null
    /** 紧急联系人电话；后端 @Sensitive 脱敏返回 */
    emergencyPhone: string | null
  } | null
  totalVolunteerHours: number
  dimensionProfile: Array<{
    dimensionCode: string
    dimensionName: string
    score: number
    targetScore: number
    gap: number
    calculationId?: number
    ruleVersion?: number
    calculatedAt?: string
  }>
  interests: Array<{
    id: number
    tagName: string
    detailContent: string
    proficiencyLevel: number
    proficiencyLabel: string
    weight: number
    isDetail: number
  }>
  semesterGrades: Array<{
    semesterId: number
    semester: string
    semesterName: string
    courseCount: number
    totalCredit: number
    gpa: number
    averageScore: number
    rankInClass: number
    rankInMajor: number
    /** 本学期逐课期末成绩（gpa_records，按 courseCode 升序）；无课程记录时为 [] 或省略 */
    courses?: Array<{
      courseCode: string
      courseName: string
      courseType: string
      credit: number
      gpa: number
      score: number
    }>
  }>
  /**
   * 累计学分加权绩点（各学期 gpa 按 total_credit 加权 / 累计总学分）。
   * 后端提供时为绩点的**唯一权威口径**，前端不得再按学期简单平均算第二份。
   * 无学期成绩时为 null。
   */
  overallGpa: number | null
  /** 累计平均分（各学期 averageScore 按 total_credit 加权）；无学期成绩时为 null */
  overallAverageScore: number | null
  personalAwards: Array<{
    category: string
    totalCount: number
    maxLevel: string
    latestTime: string
  }>
  weaknessAnalysis: Array<{
    id: number
    weaknessType: string
    weaknessDesc: string
    severityLevel: number
    isRead: number
    createdAt: string
  }>
  selfEvaluation: string | null
}

export function getProfileInfo(): Promise<ProfileInfo> {
  return request.get('/profile/info')
}

/** 获取画像分数列表（GET /profile/scores，4.1.2） */
export function getProfileScores(semesterId?: number): Promise<{
  semesterId: number
  semesterName: string
  calculatedAt: string
  ruleVersion: number
  calculationId: number
  /** 综合评分（加权总分）= Σ(各维度 score × weight)；无评分记录时为 null */
  totalScore: number | null
  /** 综合评分满分，恒为 100（= Σweight × 100）；无评分记录时为 null */
  maxTotalScore: number | null
  list: Array<{
    dimensionCode: string
    dimensionName: string
    score: number
    targetScore: number
    /** 维度权重（0-1）= 该维度下指标权重之和 = targetScore / 100。后端权威值，优先于前端推算 */
    weight: number | null
    gap: number
    /** 与对比学期的变化，恒带符号（+7/-3/+0）；无对比学期时为 null */
    change?: string | null
    comparedSemesterId?: number
    comparedSemesterName?: string
    unit: string
  }>
}> {
  return request.get('/profile/scores', { params: semesterId ? { semesterId } : undefined })
}

/** 获取分数计算说明（GET /profile/scores/{calculationId}/details，4.1.3） */
export function getScoreCalculationDetails(calculationId: number): Promise<{
  calculationId: number
  calculatedAt: string
  ruleVersion: number
  dataSource: string
  details: Array<{
    indicatorId: number
    indicatorName: string
    dimensionCode: string
    dimensionName: string
    weight: number
    rawScore: number
    weightedScore: number
    sourceArchiveIds?: number[]
    sourceArchiveTitles?: string[]
  }>
}> {
  return request.get(`/profile/scores/${calculationId}/details`)
}

/** 数据完整度单个维度（GET /profile/data-completeness） */
export interface CompletenessDimension {
  dimensionCode: string
  dimensionName: string
  rate: number
  /** 该维度尚未填写的项名（后端返回，前端只展示，不在前端重算） */
  missingItems: string[]
}

/** 获取数据完整度（GET /profile/data-completeness，4.1.4） */
export function getDataCompleteness(semesterId?: number): Promise<{
  semesterId: number
  overallRate: number
  dimensions: CompletenessDimension[]
  updatedAt: string
}> {
  return request.get('/profile/data-completeness', {
    params: semesterId ? { semesterId } : undefined,
  })
}

/**
 * 更新联系信息（PUT /profile/contact）。
 * 后端 ContactUpdateRequest 六个字段均为 @NotNull 且整体覆盖写入，必须一次性提交完整信息；
 * 只传 email/phone 会被校验拒绝（通讯地址/紧急联系人字段为空）。
 */
export function updateProfileContact(payload: {
  email: string
  phone: string
  address: string
  emergencyName: string
  emergencyRelation: string
  emergencyPhone: string
}): Promise<{
  email: string | null
  phone: string | null
  avatar: string | null
  address: string | null
  emergencyName: string | null
  emergencyRelation: string | null
  emergencyPhone: string | null
}> {
  return request.put('/profile/contact', payload)
}

/**
 * 更新出生日期（PUT /profile/birth-date）
 * 传空字符串表示清空；学历层次、政治面貌、学生状态由管理员维护，学生端不提供写接口。
 */
export function updateBirthDate(birthDate: string): Promise<{ birthDate: string | null }> {
  return request.put('/profile/birth-date', { birthDate })
}

/** 更新自我评价（PUT /profile/self-evaluation） */
export function updateSelfEvaluation(selfEvaluation: string): Promise<{ selfEvaluation: string }> {
  return request.put('/profile/self-evaluation', { selfEvaluation })
}

/** 更新兴趣标签（PUT /profile/interests） */
export function updateInterests(payload: {
  interests: Array<{
    id?: number
    tagName: string
    proficiencyLevel: number
    detailContent?: string
    isDetail?: number
  }>
}): Promise<{ updatedCount: number; addedCount: number }> {
  return request.put('/profile/interests', payload)
}

/** 删除兴趣标签（DELETE /profile/interests/{id}） */
export function deleteInterest(id: number): Promise<void> {
  return request.delete(`/profile/interests/${id}`)
}

/** 获取成长时间轴（GET /profile/growth-timeline） */
export function getGrowthTimeline(params?: {
  semesterId?: number
  eventType?: number
  status?: number
  viewType?: 'list' | 'tree' | 'ring'
}): Promise<{
  summary: { experiences: number; skills: number; averageGrowth: string; potential: string }
  timeline?: Array<Record<string, unknown>>
  tree?: Array<Record<string, unknown>>
  ring?: Array<Record<string, unknown>>
}> {
  return request.get('/profile/growth-timeline', { params })
}

/** 获取职业规划列表（GET /profile/career-plans） */
export function getCareerPlans(params?: {
  semesterId?: number
  page?: number
  per_page?: number
}): Promise<{
  list: Array<Record<string, unknown>>
  pagination: { page: number; per_page: number; total: number; total_pages: number }
}> {
  return request.get('/profile/career-plans', { params })
}
