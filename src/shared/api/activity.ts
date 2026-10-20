import type { Activity, ActivityFilters } from '@/shared/types/types'
import { ACTIVITY_FILTER_STATUS_VALUE, APPLICATION_STATUS_CODE_MAP } from '@/shared/constants/dict'
import request from './request'

const ACTIVITY_PAGE_SIZE = 100
/** 安全上限：total 异常时避免无限翻页；达到上限会在控制台明确告警 */
const ACTIVITY_MAX_PAGES = 50

/**
 * 获取动态列表（拉取全部页）
 * 对接后端 GET /activities（6.1）。
 * 接口异常时错误向上抛出（错误提示由请求拦截器统一给出），由调用方记录错误态；
 * 不再返回空数组 —— 否则「加载失败」与「确实没有动态」无法区分。
 *
 * 后端 /activities 绑定的是 PageParam.perPage（per_page 只影响 JSON 序列化），
 * 单页上限 100。此前固定取第一页 50 条，导致消息中心「动态」页签和审核计数
 * 在第 51 条之后被截断；这里按 total 取完全部页再交给页面本地分页。
 */
export async function getActivities(filters?: ActivityFilters): Promise<Activity[]> {
  const params: Record<string, any> = { perPage: ACTIVITY_PAGE_SIZE }
  if (filters?.keyword) params.keyword = filters.keyword
  if (filters?.status) params.status = statusValue(filters.status)

  const first = await fetchActivityPage(params, 1)
  const totalPages = Math.min(Math.ceil(first.total / ACTIVITY_PAGE_SIZE), ACTIVITY_MAX_PAGES)
  if (Math.ceil(first.total / ACTIVITY_PAGE_SIZE) > ACTIVITY_MAX_PAGES) {
    console.warn(
      `[activities] 动态总数 ${first.total} 超过前端安全上限 ${ACTIVITY_MAX_PAGES * ACTIVITY_PAGE_SIZE}，仅加载前 ${ACTIVITY_MAX_PAGES} 页`,
    )
  }
  const pages = [first.list]
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) => fetchActivityPage(params, i + 2)),
    )
    rest.forEach((p) => pages.push(p.list))
  }
  return pages.flat().map(mapActivity)
}

function fetchActivityPage(
  params: Record<string, any>,
  page: number,
): Promise<{ list: any[]; total: number }> {
  return request.get('/activities', { params: { ...params, page } }).then((res: any) => ({
    list: Array.isArray(res?.list) ? res.list : [],
    total: Number(res?.total) || 0,
  }))
}

function mapActivity(item: any): Activity {
  return {
    id: String(item.id),
    type:
      item.status === 2
        ? 'approved'
        : item.status === 3
          ? 'rejected'
          : item.status === 4
            ? 'withdrawn'
            : 'submitted',
    text: item.content || item.title,
    // 后端实测返回下划线字段 submit_time（见 activities.ts 接口注释），驼峰 submitTime 仅为历史兼容别名
    time: ((item.submit_time ?? item.submitTime) || '').replace('T', ' ').slice(0, 16),
    status: (APPLICATION_STATUS_CODE_MAP[item.status] as Activity['status']) ?? 'submitted',
  }
}

function statusValue(status: string): number | undefined {
  return ACTIVITY_FILTER_STATUS_VALUE[status]
}

// 动态的编辑 / 删除 / 撤回统一由 activities.ts 提供（后端契约为 PUT|DELETE /activities/{type}/{activityId}，
// type 是路径变量而非 query 参数，且必须按记录真实类别传入 archive/award/...，
// 无法在此处从 Activity 视图模型推导）。本文件此前用 `?type=archive` 的写法必然 404，
// 已移除以免被误引用。
