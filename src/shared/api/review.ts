import type { ReviewRecord } from '@/shared/types/types'
/**
 * 申报审核 API
 * 管理个人档案信息 10 个申报类型的审核状态查询与重新提交
 *
 * 后端就绪后：
 *   - getReviewList      → request.get('/reviews', { params })
 *   - getReviewListByType → request.get(`/reviews/${type}`, { params })
 *   - resubmitReview     → request.put(`/reviews/${id}/resubmit`, data)
 */
import {
  useAllReviewMockData,
  useReviewMockData,
} from '@/features/approval/composables/useReviewMockData'

export interface ReviewFilters {
  keyword?: string
  type?: string
  status?: string
  dateRange?: [string, string] | null
}

// 模块级缓存（后端就绪后直接删除这些缓存逻辑）
let cachedAll: ReviewRecord[] | null = null
const cachedByType: Record<string, ReviewRecord[]> = {}

function ensureAllCache(): ReviewRecord[] {
  if (!cachedAll) {
    cachedAll = useAllReviewMockData().value
  }
  return cachedAll
}

function ensureTypeCache(type: string): ReviewRecord[] {
  if (!cachedByType[type]) {
    cachedByType[type] = useReviewMockData(type).value
  }
  return cachedByType[type]
}

/** 获取全部申报审核列表（过滤草稿） */
export function getReviewList(filters?: ReviewFilters): Promise<ReviewRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = ensureAllCache().filter((r) => r.status !== 'draft')

      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          records = records.filter(
            (r) =>
              r.title.toLowerCase().includes(kw) || (r.typeLabel || '').toLowerCase().includes(kw),
          )
        }
        if (filters.type) records = records.filter((r) => r.type === filters.type)
        if (filters.status) records = records.filter((r) => r.status === filters.status)
        if (filters.dateRange?.[0] && filters.dateRange?.[1]) {
          const [start, end] = filters.dateRange
          records = records.filter((r) => r.submitDate >= start && r.submitDate <= end)
        }
      }

      resolve(records)
    }, 300)
  })
}

/** 按申报类型获取审核列表 */
export function getReviewListByType(
  type: string,
  filters?: Record<string, any>,
): Promise<ReviewRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = ensureTypeCache(type).filter((r) => r.status !== 'draft')

      if (filters) {
        if (filters.keyword) {
          const kw = filters.keyword.toLowerCase()
          records = records.filter((r) =>
            Object.values(r).some((v) => v && String(v).toLowerCase().includes(kw)),
          )
        }
        for (const [key, value] of Object.entries(filters)) {
          if (key !== 'keyword' && value) {
            records = records.filter((r) => r[key] === value)
          }
        }
      }

      resolve(records)
    }, 300)
  })
}

/** 重新提交审核记录（编辑后） */
export function resubmitReview(id: string, data: Record<string, any>): Promise<ReviewRecord> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = ensureAllCache()
      const idx = all.findIndex((r) => r.id === id)
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...data, status: 'submitted' }
        // 同步更新类型缓存
        const type = all[idx].type
        if (cachedByType[type]) {
          const tIdx = cachedByType[type].findIndex((r) => r.id === id)
          if (tIdx >= 0) {
            cachedByType[type][tIdx] = { ...cachedByType[type][tIdx], ...data, status: 'submitted' }
          }
        }
        resolve(all[idx])
      } else {
        resolve({ id, ...data, status: 'submitted' } as ReviewRecord)
      }
    }, 400)
  })
}
