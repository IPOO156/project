import type { ActivityListItem } from '../activities'
import type { ApplicationType, SubmissionFilters, SubmissionRecord } from '@/shared/types/types'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'
// 6.1 动态记录/6.5 撤销：申报记录数据源从 /submissions 迁移到 /activities（后端对学生端仅实现 /activities 系列）
import { getActivities } from '../activities'
import { ARCHIVE_TYPE_TO_KEY } from './archive-type'
import { sourcePathOf } from './record-utils'

/** /activities status（number）→ 前端 status 映射（1=submitted 对应待审核 pending） */
export const STATUS_MAP: Record<number, SubmissionRecord['status']> = {
  0: 'draft',
  1: 'pending',
  2: 'approved',
  3: 'rejected',
  4: 'withdrawn',
}

/**
 * ActivityListItem（6.1 动态记录）→ SubmissionRecord（提交记录）
 *  后端实际字段为下划线（archive_type/archive_type_label/submit_time/semester_name），驼峰为兼容别名。
 */
function mapActivityToSubmission(item: ActivityListItem): SubmissionRecord {
  const rawType = (item.archive_type ?? item.archiveType ?? '') as string
  // 后端 archive_type 为下划线别名（academic_competition / competition_star…），归一化为前端 ApplicationType key，
  // 否则奖项之星类记录 activityCategoryOf 会错误归类为 archive，删除/撤回接口 type 传错
  const type = (ARCHIVE_TYPE_TO_KEY[rawType] ?? rawType) as ApplicationType
  return {
    id: String(item.id),
    type,
    typeLabel:
      item.archive_type_label ?? item.archiveTypeLabel ?? APPLICATION_TYPE_MAP[type] ?? item.title,
    title: item.title ?? '',
    submitDate: (item.submit_time ?? item.submitTime ?? '').slice(0, 10),
    semester: item.semester_name ?? item.semesterName ?? '',
    status: STATUS_MAP[item.status] ?? 'pending',
    // 来源页路由（查看按钮跳转）；编辑按钮由 sourcePathOf(type, id) 带 edit 参数跳转
    sourcePath: sourcePathOf(type),
    // 后端 6.1 返回 can_withdraw/can_edit/can_delete（实测下划线），驼峰为文档别名；操作按钮据此控制
    canWithdraw: item.can_withdraw ?? item.canWithdraw,
    canEdit: item.can_edit ?? item.canEdit,
    canDelete: item.can_delete ?? item.canDelete,
  }
}

function matchFilters(record: SubmissionRecord, filters?: SubmissionFilters): boolean {
  if (!filters) return true
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    if (!record.title.toLowerCase().includes(kw) && !record.typeLabel.toLowerCase().includes(kw)) {
      return false
    }
  }
  if (filters.type && record.type !== filters.type) return false
  if (filters.status && record.status !== filters.status) return false
  const [start, end] = filters.dateRange ?? []
  if (start && record.submitDate < start) return false
  if (end && record.submitDate > end) return false
  return true
}

/**
 * 获取提交记录列表
 * 数据源：GET /activities（6.1 动态记录），映射为提交记录，筛选在前端完成。
 * 接口异常交由全局拦截器统一提示，Store 捕获后置错误态；此处不做 mock 兜底——伪造数据
 * 会被用户当成真实申报记录，与消息中心 getNotifications 同规范（见 2026-08-26 记录）。
 */
export async function getSubmissionRecords(
  filters?: SubmissionFilters,
): Promise<SubmissionRecord[]> {
  const res = await getActivities({ page: 1, per_page: 200 })
  const all = (res?.list ?? []).map(mapActivityToSubmission)
  return filters ? all.filter((r) => matchFilters(r, filters)) : all
}
