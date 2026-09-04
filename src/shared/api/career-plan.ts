import type { CareerPlanRecord } from '@/shared/types/types'
import { getSemesters } from './common'
import request from './request'

let idCounter = 10
function nextId(): string {
  return String(++idCounter)
}

const MOCK_PLANS: CareerPlanRecord[] = [
  {
    id: '1',
    semester: '2023-2024-1',
    title: '大二学年成长规划',
    submitDate: '2025-09-15',
    status: 'pending',
  },
  {
    id: '2',
    semester: '2022-2023-2',
    title: '大一学年总结与规划',
    submitDate: '2025-03-10',
    status: 'pending',
  },
]

/** 职业规划审批状态（career_plans.status 0-4）→ 前端状态 */
const CAREER_PLAN_STATUS_MAP: Record<number, CareerPlanRecord['status']> = {
  0: 'draft',
  1: 'pending',
  2: 'approved',
  3: 'rejected',
  4: 'withdrawn',
}

/**
 * 获取职业规划列表
 * 对接后端 GET /profile/career-plans，接口异常时回退 Mock。
 */
export function getCareerPlans(): Promise<CareerPlanRecord[]> {
  return request
    .get('/profile/career-plans', { params: { page: 1, per_page: 20 } })
    .then((res: any) =>
      (res?.list ?? []).map((p: any) => ({
        id: String(p.id),
        semester: p.semesterName || '',
        title: p.title,
        submitDate: (p.submittedAt || '').slice(0, 10),
        status: CAREER_PLAN_STATUS_MAP[p.status] ?? 'draft',
        progressRate: p.progressRate,
        statusLabel: p.statusLabel,
      })),
    )
    .catch(() => Promise.resolve([...MOCK_PLANS]))
}

/** 提交职业规划的载荷（字段与 POST /profile/career-plans 一致，以表单数据为准） */
export interface SubmitCareerPlanPayload {
  /** 学期（业务 name，如 "2023-2024-1"；提交时经 getSemesters() 映射为数字 semesterId） */
  semester: string
  title: string
  content?: string
  requirement?: string
  goals?: any[]
  evidenceFileIds?: number[]
}

/**
 * 提交职业规划
 * 对接后端 POST /profile/career-plans，接口异常时回退 Mock。
 * semester 为业务学期 name，提交前经 getSemesters() 映射为数字 semesterId，禁止 Number() 强制转换。
 */
export function submitCareerPlan(data: SubmitCareerPlanPayload): Promise<CareerPlanRecord> {
  const buildRecord = (id: string, res?: any): CareerPlanRecord => ({
    id,
    semester: data.semester,
    title: data.title,
    submitDate: (res?.submittedAt || new Date().toISOString()).slice(0, 10),
    status: 'pending',
    progressRate: res?.progressRate,
    statusLabel: res?.statusLabel ?? '待审批',
  })

  return getSemesters()
    .then((semesters) => {
      const matched = semesters.find((s) => s.name === data.semester)
      if (!matched) {
        throw new Error(`未找到学期「${data.semester}」，无法提交`)
      }
      return matched.value
    })
    .then((semesterId) =>
      request
        .post('/profile/career-plans', {
          semesterId,
          title: data.title,
          content: data.content,
          requirement: data.requirement,
          goals: data.goals,
          evidenceFileIds: data.evidenceFileIds,
          isDraft: 0,
        } as any)
        .then((res: any) => buildRecord(String(res.planId ?? nextId()), res)),
    )
    .catch((err: any) => {
      if (err instanceof Error && err.message.includes('未找到学期')) {
        return Promise.reject(err)
      }
      return Promise.resolve(buildRecord(nextId()))
    })
}

/** 保存职业规划草稿（对接 POST /profile/career-plans，isDraft=1） */
export function saveCareerPlanDraft(payload: {
  semesterId?: number
  title: string
  content?: string
  requirement?: string
  goals?: any[]
  evidenceFileIds?: number[]
}): Promise<{ planId: number; status: number; currentVersion: number; submitCount: number }> {
  return request.post('/profile/career-plans', { ...payload, isDraft: 1 })
}

/** 获取职业规划详情（GET /profile/career-plans/{planId}） */
export function getCareerPlanDetail(planId: number): Promise<any> {
  return request.get(`/profile/career-plans/${planId}`)
}

/** 下载职业规划文件（GET /profile/career-plans/{planId}/download） */
export function downloadCareerPlanFile(
  planId: number,
  purpose: 'internal' | 'external' = 'external',
): Promise<void> {
  return request.get(`/profile/career-plans/${planId}/download`, { params: { purpose } })
}

/** 预览职业规划文件（GET /profile/career-plans/{planId}/preview） */
export function previewCareerPlanFile(
  planId: number,
  purpose: 'internal' | 'external' = 'external',
): Promise<{
  previewUrl: string
  fileName: string
  purpose: string
  generatedAt: string
}> {
  return request.get(`/profile/career-plans/${planId}/preview`, { params: { purpose } })
}

/** 复制上一学期计划（POST /profile/career-plans/copy） */
export function copyCareerPlan(payload: {
  sourceSemesterId: number
  targetSemesterId: number
  title?: string
}): Promise<{ planId: number; copyFromId: number; status: number }> {
  return request.post('/profile/career-plans/copy', payload)
}

/** 添加目标（POST /profile/career-plans/{planId}/goals） */
export function addCareerGoal(
  planId: number,
  payload: {
    goalTitle: string
    goalDesc?: string
    targetDate?: string
    sort?: number
  },
): Promise<{ goalId: number }> {
  return request.post(`/profile/career-plans/${planId}/goals`, payload)
}

/** 更新目标（PUT /profile/career-plans/{planId}/goals/{goalId}） */
export function updateCareerGoal(
  planId: number,
  goalId: number,
  payload: {
    goalTitle: string
    goalDesc?: string
    targetDate?: string
    sort?: number
  },
): Promise<{ goalId: number }> {
  return request.put(`/profile/career-plans/${planId}/goals/${goalId}`, payload)
}

/** 删除目标（DELETE /profile/career-plans/{planId}/goals/{goalId}） */
export function deleteCareerGoal(planId: number, goalId: number): Promise<void> {
  return request.delete(`/profile/career-plans/${planId}/goals/${goalId}`)
}

/** 添加行动（POST /profile/career-plans/{planId}/goals/{goalId}/actions） */
export function addCareerAction(
  planId: number,
  goalId: number,
  payload: {
    actionTitle: string
    actionDesc?: string
    startDate?: string
    endDate?: string
    sort?: number
  },
): Promise<{ actionId: number }> {
  return request.post(`/profile/career-plans/${planId}/goals/${goalId}/actions`, payload)
}

/** 添加里程碑（POST /profile/career-plans/{planId}/actions/{actionId}/milestones） */
export function addCareerMilestone(
  planId: number,
  actionId: number,
  payload: {
    milestoneTitle: string
    milestoneDate?: string
  },
): Promise<{ milestoneId: number }> {
  return request.post(`/profile/career-plans/${planId}/actions/${actionId}/milestones`, payload)
}

/** 更新里程碑（PUT /profile/career-plans/{planId}/milestones/{milestoneId}） */
export function updateCareerMilestone(
  planId: number,
  milestoneId: number,
  payload: {
    milestoneTitle: string
    milestoneDate?: string
    isAchieved?: 0 | 1
    proofFileId?: number
  },
): Promise<{ milestoneId: number }> {
  return request.put(`/profile/career-plans/${planId}/milestones/${milestoneId}`, payload)
}

/** 删除里程碑（DELETE /profile/career-plans/{planId}/milestones/{milestoneId}） */
export function deleteCareerMilestone(planId: number, milestoneId: number): Promise<void> {
  return request.delete(`/profile/career-plans/${planId}/milestones/${milestoneId}`)
}

/** 更新行动（PUT /profile/career-plans/{planId}/actions/{actionId}） */
export function updateCareerAction(
  planId: number,
  actionId: number,
  payload: {
    actionTitle: string
    actionDesc?: string
    startDate?: string
    endDate?: string
    sort?: number
  },
): Promise<{ actionId: number }> {
  return request.put(`/profile/career-plans/${planId}/actions/${actionId}`, payload)
}

/** 删除行动（DELETE /profile/career-plans/{planId}/actions/{actionId}） */
export function deleteCareerAction(planId: number, actionId: number): Promise<void> {
  return request.delete(`/profile/career-plans/${planId}/actions/${actionId}`)
}

/** 更新行动状态（PUT /profile/career-plans/{planId}/actions/{actionId}/status） */
export function updateCareerActionStatus(
  planId: number,
  actionId: number,
  status: 0 | 1 | 2,
): Promise<{
  actionId: number
  status: number
  statusLabel: string
  completionRate: number
}> {
  return request.put(`/profile/career-plans/${planId}/actions/${actionId}/status`, { status })
}

/** 上传行动成果（POST /profile/career-plans/{planId}/actions/{actionId}/files） */
export function uploadCareerActionFile(
  planId: number,
  actionId: number,
  fileId: number,
): Promise<{
  fileId: number
  fileName: string
  fileUrl: string
}> {
  return request.post(`/profile/career-plans/${planId}/actions/${actionId}/files`, { fileId })
}

/** 添加阶段反思（POST /profile/career-plans/{planId}/reflections） */
export function addCareerReflection(
  planId: number,
  reflectionContent: string,
): Promise<{
  reflectionId: number
}> {
  return request.post(`/profile/career-plans/${planId}/reflections`, { reflectionContent })
}

/** AI 建议一键添加为计划（POST /profile/career-plans/ai-add） */
export function aiAddCareerPlan(payload: {
  aiSuggestionId: number
  semesterId: number
  title?: string
  requireConfirm?: number
}): Promise<{
  planId: number
  status: number
  statusLabel: string
  source: number
  sourceLabel: string
  requireConfirm: number
}> {
  return request.post('/profile/career-plans/ai-add', payload)
}

/* ===================== 档案导出 ===================== */

/** 档案导出预览（GET /profile/export/preview） */
export function previewArchiveExport(): Promise<{
  sections: Array<{ code: string; name: string; selected: boolean; disabled: boolean }>
  dataVersion: string
  generatedAt: string
}> {
  return request.get('/profile/export/preview')
}

/** 提交档案导出（POST /profile/export） */
export function submitArchiveExport(payload: {
  sections?: string[]
  fileType?: 'pdf'
  purpose?: 'internal' | 'external'
}): Promise<{
  exportJobId: number
  status: number
  statusLabel: string
  fileId: number
  downloadUrl: string
  expireAt: string
}> {
  return request.post('/profile/export', payload)
}

/* ===================== 简历导出 ===================== */

/** 简历导出预览（GET /profile/resume/export/preview） */
export function previewResumeExport(): Promise<{
  sections: Array<{ code: string; name: string; selected: boolean; disabled: boolean }>
  dataVersion: string
  generatedAt: string
}> {
  return request.get('/profile/resume/export/preview')
}

/** 提交简历导出（POST /profile/resume/export） */
export function submitResumeExport(payload: {
  sections?: string[]
  fileType?: 'pdf'
  purpose?: 'internal' | 'external'
}): Promise<{
  exportJobId: number
  status: number
  statusLabel: string
  fileId: number
  downloadUrl: string
  expireAt: string
}> {
  return request.post('/profile/resume/export', payload)
}
