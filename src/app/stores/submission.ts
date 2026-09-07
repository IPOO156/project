import type { SubmissionFilters, SubmissionRecord } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  activityCategoryOf,
  getSubmissionRecords,
  withdrawSubmission,
} from '@/shared/api/submission'

export const useSubmissionStore = defineStore('submission', () => {
  const records = ref<SubmissionRecord[]>([])
  const filteredRecords = ref<SubmissionRecord[]>([])
  const loading = ref(false)
  let pendingFetch: Promise<void> | null = null
  let lastFetchedAt = 0
  const CACHE_TTL_MS = 60_000
  async function fetchRecords(filters?: SubmissionFilters, force = false): Promise<void> {
    // ① 并发重入：已经有请求在飞，直接共享同一个 Promise
    if (pendingFetch) return pendingFetch

    const isFiltered = !!filters

    // ② 跨页冗余：全量数据刚拉过且没过期，直接用缓存不发请求
    if (
      !force &&
      !isFiltered &&
      Date.now() - lastFetchedAt < CACHE_TTL_MS &&
      records.value.length > 0
    ) {
      filteredRecords.value = records.value
      return
    }

    loading.value = true

    // ③ 把整段请求逻辑包进 IIFE，赋值给 pendingFetch
    pendingFetch = (async () => {
      try {
        // 只有 filters 场景才发条件请求，否则只发一次全量
        const data = isFiltered ? await getSubmissionRecords(filters) : await getSubmissionRecords()

        filteredRecords.value = data

        if (!isFiltered) {
          // ④ 全量结果才写 records 缓存 + 记时间戳（TTL 靠这个）
          records.value = data
          lastFetchedAt = Date.now()
        }
      } finally {
        loading.value = false
      }
    })()

    // ⑤ 调用方 await 同一个 Promise，完成后清理
    try {
      await pendingFetch
    } finally {
      pendingFetch = null
    }
  }

  async function withdrawRecord(id: string): Promise<void> {
    const rec = getRecordById(id)
    await withdrawSubmission(id, rec ? activityCategoryOf(rec.type) : 'archive')
    updateLocalStatus(id, 'withdrawn')
  }

  function updateLocalStatus(id: string, newStatus: string) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx >= 0) records.value[idx] = { ...records.value[idx], status: newStatus as any }
    const fIdx = filteredRecords.value.findIndex((r) => r.id === id)
    if (fIdx >= 0)
      filteredRecords.value[fIdx] = { ...filteredRecords.value[fIdx], status: newStatus as any }
  }

  function addRecord(record: SubmissionRecord) {
    records.value.unshift(record)
    filteredRecords.value.unshift(record)
  }
  function removeRecord(id: string) {
    records.value = records.value.filter((r) => r.id !== id)
    filteredRecords.value = filteredRecords.value.filter((r) => r.id !== id)
  }
  function getRecordById(id: string): SubmissionRecord | undefined {
    return records.value.find((r) => r.id === id)
  }

  return {
    records,
    filteredRecords,
    loading,
    fetchRecords,
    withdrawRecord,
    updateLocalStatus,
    addRecord,
    removeRecord,
    getRecordById,
  }
})
