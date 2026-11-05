import type {
  DashboardStatistics,
  GradeImportConfigItem,
  GradeImportConfigPayload,
  GradeImportDetail,
  GradeImportListItem,
  GradeImportPayload,
  GradeImportQuery,
  GradeImportResult,
  HeatmapStatistics,
  OrgOverviewStatistics,
  PageResult,
  ScoreRecalculatePayload,
  ScoreRecalculateResult,
  ScoreRecalculationTask,
  StatisticsQuery,
  TeacherDashboardData,
  TeacherDashboardOverview,
  TeacherSnapshotRefresh,
  TeacherSnapshotRefreshPayload,
} from '@/shared/types/teacher'
import { downloadBlobFile } from '@/shared/utils/download'
import request from './request'

/* ===================== 评分重算（教师端 /teacher/scores）===================== */

/** 触发评分重算（教师端仅支持 targetType 1学生/2班级/3学期，前端已去掉 4全量） */
export function triggerScoreRecalculate(
  payload: ScoreRecalculatePayload,
): Promise<ScoreRecalculateResult> {
  return request.post('/teacher/scores/recalculate', payload)
}

export function getRecalculationTask(taskId: number): Promise<ScoreRecalculationTask> {
  return request.get(`/teacher/scores/recalculation-tasks/${taskId}`)
}

/* ===================== 成绩导入（/admin/grades）===================== */

export function submitGradeImport(payload: GradeImportPayload): Promise<GradeImportResult> {
  return request.post('/admin/grades/import', payload)
}

export function listGradeImports(
  params: GradeImportQuery,
): Promise<PageResult<GradeImportListItem>> {
  return request.get('/admin/grades/imports', { params })
}

export function getGradeImportDetail(importId: number): Promise<GradeImportDetail> {
  return request.get(`/admin/grades/imports/${importId}`)
}

/** 下载成绩导入模板（后端返回 xlsx 二进制） */
export async function downloadGradeImportTemplate(): Promise<void> {
  await downloadBlobFile('/admin/grades/import-template', '成绩导入模板.xlsx')
}

/* ===================== 成绩导入配置（/admin/grade-import-configs）===================== */

export function getGradeImportConfig(): Promise<GradeImportConfigItem> {
  return request.get('/admin/grade-import-configs')
}

export function createGradeImportConfig(
  payload: GradeImportConfigPayload,
): Promise<GradeImportConfigItem> {
  return request.post('/admin/grade-import-configs', payload)
}

export function updateGradeImportConfig(
  id: number,
  payload: Partial<GradeImportConfigPayload>,
): Promise<GradeImportConfigItem> {
  return request.put(`/admin/grade-import-configs/${id}`, payload)
}

export function deleteGradeImportConfig(id: number): Promise<void> {
  return request.delete(`/admin/grade-import-configs/${id}`)
}

export function updateGradeImportConfigStatus(id: number, status: number): Promise<void> {
  return request.patch(`/admin/grade-import-configs/${id}/status`, { status })
}

/* ===================== 统计看板 ===================== */

/** 教师端统计看板（GET /teacher/statistics/dashboard，字段与 admin 版不同，前端已适配） */
export function getTeacherStatisticsDashboard(
  params: Pick<StatisticsQuery, 'semesterId' | 'grade'>,
): Promise<TeacherDashboardData> {
  return request.get('/teacher/statistics/dashboard', { params })
}

/** 管理端统计看板（/admin/statistics/dashboard，仅管理员，教师端已改用教师版） */
export function getStatisticsDashboard(
  params: Pick<StatisticsQuery, 'semesterId' | 'grade'>,
): Promise<DashboardStatistics> {
  return request.get('/admin/statistics/dashboard', { params })
}

/** 教师端组织统计看板（GET /teacher/statistics/overview，响应与 admin 版兼容） */
export function getStatisticsOverview(params: StatisticsQuery): Promise<OrgOverviewStatistics> {
  return request.get('/teacher/statistics/overview', { params })
}

/** 教师端成果热力图（GET /teacher/statistics/heatmap，响应与 admin 版兼容） */
export function getStatisticsHeatmap(params: StatisticsQuery): Promise<HeatmapStatistics> {
  return request.get('/teacher/statistics/heatmap', { params })
}

/** 管理端成果热力图（GET /admin/statistics/heatmap，返回全校范围数据） */
export function getAdminStatisticsHeatmap(params: StatisticsQuery): Promise<HeatmapStatistics> {
  return request.get('/admin/statistics/heatmap', { params })
}

/** 教师端统计快照刷新（POST /teacher/statistics/refresh） */
export function refreshTeacherStatistics(
  payload: TeacherSnapshotRefreshPayload,
): Promise<TeacherSnapshotRefresh> {
  // 后端以 @RequestParam 接收 semesterId，需走 query 而非 body
  return request.post('/teacher/statistics/refresh', null, { params: payload })
}

/** 管理端统计快照刷新（POST /admin/statistics/refresh） */
export function refreshAdminStatistics(
  payload: TeacherSnapshotRefreshPayload,
): Promise<TeacherSnapshotRefresh> {
  return request.post('/admin/statistics/refresh', null, { params: payload })
}

/* ===================== 教师端-工作台（GET /teacher/dashboard）===================== */

/** 教师端工作台总览：教师信息/管辖范围/待办统计/今日审核/最近审核动态 */
export function getTeacherDashboardOverview(): Promise<TeacherDashboardOverview> {
  return request.get('/teacher/dashboard')
}
