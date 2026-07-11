import type { ReviewFilters } from '@/shared/api/review'
import type { ReviewRecord } from '@/shared/types/types'
import { ElMessage } from 'element-plus'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  resubmitReview as apiResubmit,
  getReviewList,
  getReviewListByType,
} from '@/shared/api/review'

/**
 * 申报审核 Store
 * 管理 10 个申报类型的审核记录查询与重新提交
 * 数据来源：reviewApi（后端就绪后只需改 API 层）
 */
export const useReviewStore = defineStore('review', () => {
  const allRecords = ref<ReviewRecord[]>([])
  const typeRecords = ref<Record<string, ReviewRecord[]>>({})
  const loading = ref(false)

  /** 加载全部审核记录（首次加载缓存全量，带筛选时返回筛选结果） */
  async function fetchAll(filters?: ReviewFilters): Promise<ReviewRecord[]> {
    loading.value = true
    try {
      if (allRecords.value.length === 0) {
        allRecords.value = await getReviewList()
      }
      if (filters) {
        return await getReviewList(filters)
      }
      return allRecords.value
    } finally {
      loading.value = false
    }
  }

  /** 按类型加载审核记录 */
  async function fetchByType(type: string, filters?: Record<string, any>): Promise<ReviewRecord[]> {
    loading.value = true
    try {
      const records = await getReviewListByType(type, filters)
      typeRecords.value = { ...typeRecords.value, [type]: records }
      return records
    } finally {
      loading.value = false
    }
  }

  /** 重新提交审核记录（编辑后） */
  async function resubmit(id: string, data: Record<string, any>): Promise<void> {
    const updated = await apiResubmit(id, data)

    // 同步全量缓存
    const allIdx = allRecords.value.findIndex((r) => r.id === id)
    if (allIdx >= 0) allRecords.value[allIdx] = { ...allRecords.value[allIdx], ...updated }
    // 同步类型缓存
    const type = updated.type
    if (typeRecords.value[type]) {
      const tIdx = typeRecords.value[type].findIndex((r) => r.id === id)
      if (tIdx >= 0)
        typeRecords.value[type][tIdx] = { ...typeRecords.value[type][tIdx], ...updated }
    }

    ElMessage.success('修改已保存，等待重新审核')
  }

  return { allRecords, typeRecords, loading, fetchAll, fetchByType, resubmit }
})
