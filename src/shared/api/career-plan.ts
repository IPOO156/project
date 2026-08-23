import type { CareerPlanRecord } from '@/shared/types/types'
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
    status: 'submitted',
  },
  {
    id: '2',
    semester: '2022-2023-2',
    title: '大一学年总结与规划',
    submitDate: '2025-03-10',
    status: 'submitted',
  },
]

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
        status: p.status === 0 ? 'draft' : 'submitted',
      })),
    )
    .catch(() => Promise.resolve([...MOCK_PLANS]))
}

/**
 * 提交职业规划
 * 对接后端 POST /profile/career-plans，接口异常时回退 Mock。
 */
export function submitCareerPlan(
  data: Pick<CareerPlanRecord, 'semester' | 'title'>,
): Promise<CareerPlanRecord> {
  const buildRecord = (id: string): CareerPlanRecord => ({
    id,
    semester: data.semester,
    title: data.title,
    submitDate: new Date().toISOString().slice(0, 10),
    status: 'submitted',
  })
  return request
    .post('/profile/career-plans', {
      semesterId: Number(data.semester) || 1,
      title: data.title,
      isDraft: 0,
    } as any)
    .then((res: any) => buildRecord(String(res.planId ?? nextId())))
    .catch(() => Promise.resolve(buildRecord(nextId())))
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
