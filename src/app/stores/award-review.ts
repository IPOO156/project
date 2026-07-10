import type { AwardReviewFilters } from '@/shared/api/award-review'
import type { StarRecord } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { resubmitAwardReview as apiResubmit, getAwardReviewList } from '@/shared/api/award-review'

/**
 * 奖项审核 Store
 * 管理竞赛之星/科研之星/双创之星的报名审核记录
 * 数据来源：awardReviewApi（后端就绪后只需改 API 层）
 */
export const useAwardReviewStore = defineStore('award-review', () => {
  const allRecords = ref<StarRecord[]>([])
  const loading = ref(false)

  /** 加载奖项审核记录 */
  async function fetchAll(filters?: AwardReviewFilters): Promise<void> {
    loading.value = true
    try {
      allRecords.value = await getAwardReviewList(filters)
    } finally {
      loading.value = false
    }
  }

  /** 重新提交奖项审核记录（编辑后） */
  async function resubmit(id: string, data: Record<string, any>): Promise<void> {
    const updated = await apiResubmit(id, data)
    const idx = allRecords.value.findIndex((r) => r.id === id)
    if (idx >= 0) allRecords.value[idx] = { ...allRecords.value[idx], ...updated }
    ElMessage.success('修改已保存，等待重新审核')
  }

  return { allRecords, loading, fetchAll, resubmit }
})
