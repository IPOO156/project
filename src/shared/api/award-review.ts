/**
 * 奖项审核 API
 * 管理竞赛之星/科研之星/双创之星的报名审核状态查询与重新提交
 *
 * 后端就绪后：
 *   - getAwardReviewList  → request.get('/award-reviews', { params })
 *   - resubmitAwardReview → request.put(`/award-reviews/${id}/resubmit`, data)
 */
import type { StarRecord } from '@/shared/types/types'
import { useStarMockData } from '@/features/approval/composables/useStarMockData'

export interface AwardReviewFilters {
  type?: string // competitionStar | innovationStar | scientificStar
}

let cached: StarRecord[] | null = null

function ensureCache(): StarRecord[] {
  if (!cached) {
    cached = useStarMockData().value
  }
  return cached
}

/** 获取奖项审核列表（过滤草稿） */
export function getAwardReviewList(filters?: AwardReviewFilters): Promise<StarRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let records = ensureCache().filter((r) => r.status !== 'draft')

      if (filters?.type) {
        if (filters.type === 'scientificStar') {
          records = records.filter((r) =>
            ['scientificProject', 'softwareCopyright', 'paper'].includes(r.type),
          )
        } else {
          records = records.filter((r) => r.type === filters.type)
        }
      }

      resolve(records)
    }, 300)
  })
}

/** 重新提交奖项审核记录（编辑后） */
export function resubmitAwardReview(id: string, data: Record<string, any>): Promise<StarRecord> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = ensureCache()
      const idx = all.findIndex((r) => r.id === id)
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...data, status: 'submitted' }
        resolve(all[idx])
      } else {
        resolve({ id, ...data, status: 'submitted' } as StarRecord)
      }
    }, 400)
  })
}
