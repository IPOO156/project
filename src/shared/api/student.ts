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
    trend: string
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
    birthDate: string
  }
  contactInfo: {
    email: string | null
    phone: string | null
    avatar: string | null
  }
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
  }>
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
  list: Array<{
    dimensionCode: string
    dimensionName: string
    score: number
    targetScore: number
    gap: number
    change?: string
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

/** 获取数据完整度（GET /profile/data-completeness，4.1.4） */
export function getDataCompleteness(semesterId?: number): Promise<{
  semesterId: number
  overallRate: number
  dimensions: Array<{
    dimensionCode: string
    dimensionName: string
    rate: number
    missingItems: string[]
  }>
  updatedAt: string
}> {
  return request.get('/profile/data-completeness', {
    params: semesterId ? { semesterId } : undefined,
  })
}

/** 更新联系信息（PUT /profile/contact） */
export function updateProfileContact(payload: {
  email?: string
  phone?: string
  address?: string
}): Promise<{
  email: string | null
  phone: string | null
  avatar: string | null
}> {
  return request.put('/profile/contact', payload)
}

/** 更新政治面貌（PUT /profile/political-status） */
export function updatePoliticalStatus(politicalStatus: string): Promise<{
  politicalStatus: string
  politicalStatusLabel: string
}> {
  return request.put('/profile/political-status', { politicalStatus })
}

/** 更新学生状态（PUT /profile/student-status） */
export function updateStudentStatus(studentStatus: string): Promise<{
  studentStatus: string
  studentStatusLabel: string
}> {
  return request.put('/profile/student-status', { studentStatus })
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
  timeline?: Array<Record<string, any>>
  tree?: Array<Record<string, any>>
  ring?: Array<Record<string, any>>
}> {
  return request.get('/profile/growth-timeline', { params })
}

/** 获取职业规划列表（GET /profile/career-plans） */
export function getCareerPlans(params?: {
  semesterId?: number
  page?: number
  per_page?: number
}): Promise<{
  list: Array<Record<string, any>>
  pagination: { page: number; per_page: number; total: number; total_pages: number }
}> {
  return request.get('/profile/career-plans', { params })
}
