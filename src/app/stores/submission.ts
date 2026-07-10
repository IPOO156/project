import type { SubmissionFilters, SubmissionRecord } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSubmissionRecords, withdrawSubmission } from '@/shared/api/submission'

/**
 * 统一提交记录 Store
 * 聚合所有申报模块与奖项模块的提交记录，支持筛选/搜索
 * 数据来源：submissionApi（后端就绪后只需改 API 层）
 */
export const useSubmissionStore = defineStore('submission', () => {
  const records = ref<SubmissionRecord[]>([])
  const filteredRecords = ref<SubmissionRecord[]>([])
  const loading = ref(false)

  async function fetchRecords(filters?: SubmissionFilters): Promise<void> {
    loading.value = true
    try {
      // 全量数据（用于计数/成长时间轴同步），首次加载后缓存
      if (records.value.length === 0) {
        records.value = await getSubmissionRecords()
      }
      // 筛选数据
      filteredRecords.value = filters ? await getSubmissionRecords(filters) : records.value
    } finally {
      loading.value = false
    }
  }

  async function withdrawRecord(id: string): Promise<void> {
    await withdrawSubmission(id)
    // 同步更新本地状态
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx >= 0) {
      records.value[idx] = { ...records.value[idx], status: 'draft' }
    }
    const fIdx = filteredRecords.value.findIndex((r) => r.id === id)
    if (fIdx >= 0) {
      filteredRecords.value[fIdx] = { ...filteredRecords.value[fIdx], status: 'draft' }
    }
  }

  return { records, filteredRecords, loading, fetchRecords, withdrawRecord }
})
