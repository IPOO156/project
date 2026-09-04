import type { AwardReviewFilters } from '@/shared/api/award-review'
import type { StarRecord } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { updateActivity } from '@/shared/api/activities'
import { getActivities } from '@/shared/api/activity'

/**
 * 奖项审核 Store
 * 管理竞赛之星/科研之星/双创之星的报名审核记录
 * 数据来源：GET /activities（动态记录，type=award）+ PUT /activities/{id}
 */
export const useAwardReviewStore = defineStore('award-review', () => {
  const allRecords = ref<StarRecord[]>([])
  const loading = ref(false)

  /** 加载奖项审核记录（对接 /activities，过滤 award 类型） */
  async function fetchAll(_filters?: AwardReviewFilters): Promise<void> {
    loading.value = true
    try {
      const activities = await getActivities()
      allRecords.value = activities
        .filter(
          (a: any) =>
            a.type === 'award' ||
            [
              'competitionStar',
              'innovationStar',
              'scientificProject',
              'softwareCopyright',
              'paper',
            ].includes(a.type),
        )
        .map((a: any) => ({
          id: a.id,
          type: a.type || '',
          typeLabel: a.typeLabel || '',
          title: a.text || a.title || '',
          submitDate: a.time || '',
          semester: a.semester || '',
          status: a.status || 'pending',
          sourcePath: '',
          applicant: '',
        }))
    } finally {
      loading.value = false
    }
  }

  /** 重新提交奖项审核记录（对接 PUT /activities/{id}） */
  async function resubmit(id: string, data: Record<string, any>): Promise<void> {
    try {
      await updateActivity(Number(id), 'award', data)
    } catch {
      /* 接口失败时本地更新 */
    }
    const idx = allRecords.value.findIndex((r) => r.id === id)
    if (idx >= 0) allRecords.value[idx] = { ...allRecords.value[idx], ...data, status: 'pending' }
    ElMessage.success('修改已保存，等待重新审核')
  }

  return { allRecords, loading, fetchAll, resubmit }
})
