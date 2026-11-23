import type { AwardReviewFilters } from '@/shared/api/award-review'
import type { StarRecord } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getActivities } from '@/shared/api/activity'
import { applyResubmitted, mapActivityBase, resubmitActivity } from './reviewRecordShared'

/**
 * 奖项审核 Store
 * 管理竞赛之星/科研之星/双创之星的报名审核记录
 * 数据来源：GET /activities（动态记录，type=award）+ PUT /activities/{id}
 */
export const useAwardReviewStore = defineStore('award-review', () => {
  const allRecords = ref<StarRecord[]>([])
  const loading = ref(false)
  /** getActivities 失败标记；StarDialog 不渲染本列表，但保留状态供后续列表页区分「空」与「失败」 */
  const loadFailed = ref(false)

  /** 加载奖项审核记录（对接 /activities，过滤 award 类型） */
  async function fetchAll(_filters?: AwardReviewFilters): Promise<void> {
    loading.value = true
    try {
      const activities = await getActivities()
      allRecords.value = activities
        .filter((a) =>
          [
            'award',
            'competitionStar',
            'innovationStar',
            'scientificProject',
            'softwareCopyright',
            'paper',
          ].includes(a.type ?? ''),
        )
        .map((a) => ({
          ...mapActivityBase(a),
          sourcePath: '',
          applicant: '',
        }))
      loadFailed.value = false
    } catch {
      // 错误提示由请求拦截器统一给出；保留已有列表，仅记录错误态
      loadFailed.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * 重新提交奖项审核记录（对接 PUT /activities/{id}）。
   *  接口失败时错误向上抛出（拦截器已统一提示），禁止本地伪造 pending 状态与假成功提示
   */
  async function resubmit(id: string, data: Record<string, any>): Promise<void> {
    await resubmitActivity(id, 'award', data)
    applyResubmitted(allRecords.value, id, data)
  }

  /** 重置用户级状态（登出/换账号时调用） */
  function reset(): void {
    allRecords.value = []
    loading.value = false
    loadFailed.value = false
  }

  return { allRecords, loading, loadFailed, fetchAll, resubmit, reset }
})
