import type {
  TeacherCareerFeedbackPayload,
  TeacherCareerFeedbackResult,
  TeacherCareerPlanDetail,
  TeacherGrowthTimeline,
  TeacherImprovementSuggestionPayload,
  TeacherImprovementSuggestionResult,
  TeacherStudentProfile,
  TeacherWeaknessItem,
} from '@/shared/types/teacher'
import request from './request'

/* ===================== 教师端-学生档案（/teacher/students）===================== */

/** 学生成长档案总览（GET /teacher/students/{userId}/profile） */
export async function getTeacherStudentProfile(userId: number): Promise<TeacherStudentProfile> {
  // 后端返回 { isInScope, profile: {...} }，此处展开 profile 供页面扁平化使用
  const res = (await request.get(`/teacher/students/${userId}/profile`)) as unknown as {
    isInScope?: boolean
    profile?: TeacherStudentProfile
  }
  return { isInScope: res?.isInScope ?? true, ...(res?.profile ?? {}) } as TeacherStudentProfile
}

/** 学生成长时间轴（GET /teacher/students/{userId}/growth-timeline） */
export function getTeacherStudentTimeline(
  userId: number,
  params?: { semesterId?: number; eventType?: number },
): Promise<TeacherGrowthTimeline> {
  return request.get(`/teacher/students/${userId}/growth-timeline`, { params })
}

/** 学生短板分析（GET /teacher/students/{userId}/weaknesses） */
export function getTeacherStudentWeaknesses(userId: number): Promise<TeacherWeaknessItem[]> {
  return request.get(`/teacher/students/${userId}/weaknesses`)
}

/** 学生职业规划详情（GET /teacher/students/{userId}/career-plans/{planId}） */
export function getTeacherStudentCareerPlan(
  userId: number,
  planId: number,
): Promise<TeacherCareerPlanDetail> {
  return request.get(`/teacher/students/${userId}/career-plans/${planId}`)
}

/** 教师对职业规划提交反馈（POST /teacher/career-plans/{planId}/feedbacks） */
export function submitTeacherCareerFeedback(
  planId: number,
  payload: TeacherCareerFeedbackPayload,
): Promise<TeacherCareerFeedbackResult> {
  return request.post(`/teacher/career-plans/${planId}/feedbacks`, payload)
}

/** 教师为学生添加改进建议（POST /teacher/students/{userId}/improvement-suggestions） */
export function addTeacherImprovementSuggestion(
  userId: number,
  payload: TeacherImprovementSuggestionPayload,
): Promise<TeacherImprovementSuggestionResult> {
  return request.post(`/teacher/students/${userId}/improvement-suggestions`, payload)
}
