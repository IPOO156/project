/**
 * 教师端/管理端 API 类型 —— 教师端学生档案（/teacher/students）
 */

export interface TeacherStudentAcademicInfo {
  userId: number
  name: string | null
  studentNo: string | null
  grade: string | null
  major: string | null
  degreeType: number | null
  degreeTypeLabel: string | null
  className: string | null
  collegeName: string | null
  gender: number | null
  genderLabel: string | null
  politicalStatus: number | null
  politicalStatusLabel: string | null
  studentStatus: number | null
  studentStatusLabel: string | null
  birthDate: string | null
}

export interface TeacherStudentContactInfo {
  email: string | null
  phone: string | null
  avatar: string | null
  address: string | null
  emergencyName: string | null
  emergencyRelation: string | null
  emergencyPhone: string | null
}

export interface TeacherDimensionProfileItem {
  dimensionCode: string
  dimensionName: string
  score: number | null
  targetScore: number | null
  gap: number | null
  calculationId: number | null
  ruleVersion: number | null
  calculatedAt: string | null
}

/** GET /teacher/students/{userId}/profile（isInScope + ProfileInfo 扁平展开） */
export interface TeacherStudentProfile {
  isInScope: boolean
  academicInfo: TeacherStudentAcademicInfo
  contactInfo: TeacherStudentContactInfo
  totalVolunteerHours: number | null
  dimensionProfile: TeacherDimensionProfileItem[]
  interests: string[] | null
  semesterGrades: unknown[] | null
  personalAwards: unknown[] | null
  weaknessAnalysis: string | null
  selfEvaluation: string | null
}

/* 成长时间轴 */

export interface TeacherTimelineSummary {
  experiences: number | null
  skills: number | null
  averageGrowth: number | null
  potential: number | null
}

export interface TeacherTimelineItem {
  id: number
  semesterId: number | null
  semesterName: string | null
  eventAt: string | null
  eventName: string
  content: string | null
  eventType: number
  eventTypeLabel: string
  status: number | null
  statusLabel: string | null
  coverImage: string | null
  sourceId: number | null
  sourceType: string | null
  abilityData: unknown | null
  tags: string[] | null
}

export interface TeacherGrowthTimeline {
  summary: TeacherTimelineSummary
  timeline: TeacherTimelineItem[]
  tree: unknown | null
  ring: unknown | null
}

/* 职业规划详情 */

export interface TeacherCareerFeedbackItem {
  id: number
  teacherName: string | null
  feedbackContent: string
  createdAt: string | null
}

/** GET /teacher/students/{userId}/career-plans/{planId} */
export interface TeacherCareerPlanDetail {
  id: number
  semesterId: number | null
  semesterName: string | null
  title: string
  content: string | null
  requirement: string | null
  progressRate: number | null
  status: number | null
  statusLabel: string | null
  submittedAt: string | null
  auditedAt: string | null
  auditorName: string | null
  rejectedReason: string | null
  goals: unknown[] | null
  reflections: unknown[] | null
  feedbacks: TeacherCareerFeedbackItem[]
  versionHistory: unknown[] | null
}

export interface TeacherCareerFeedbackPayload {
  feedbackContent: string
  suggestionItems?: string[]
}

export interface TeacherCareerFeedbackResult {
  feedbackId: number
  createdAt: string | null
}

/* 短板与改进建议 */

export interface TeacherWeaknessItem {
  id: number
  weaknessType: string | null
  weaknessDesc: string | null
  severityLevel: number | null
  source: number | null
  sourceLabel: string | null
  isRead: number | null
  createdAt: string | null
}

export interface TeacherImprovementSuggestionPayload {
  weaknessId?: number
  suggestionType: string
  content: string
  relatedGoalId?: number
}

export interface TeacherImprovementSuggestionResult {
  suggestionId: number
  createdAt: string | null
}
