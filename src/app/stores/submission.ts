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

  async function fetchRecords(filters?: SubmissionFilters): Promise<void> {
    loading.value = true
    try {
      if (records.value.length === 0) records.value = await getSubmissionRecords()
      filteredRecords.value = filters ? await getSubmissionRecords(filters) : records.value
    } finally {
      loading.value = false
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
