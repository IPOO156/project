import type { SubmissionFilters, SubmissionRecord } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { deleteActivity } from '@/shared/api/activities'
import {
  activityCategoryOf,
  getSubmissionRecords,
  withdrawSubmission,
} from '@/shared/api/submission'

export const useSubmissionStore = defineStore('submission', () => {
  const records = ref<SubmissionRecord[]>([])
  const filteredRecords = ref<SubmissionRecord[]>([])
  const loading = ref(false)
  // 接口拉取失败标志：区分「后端确实无申报记录」与「请求失败」，失败时不伪造数据（2026-08-31 移除 mock 兜底）
  const loadError = ref(false)

  // 已撤回记录 ID 集合：后端撤回后落库为 status=0（草稿），列表接口不返回 revoked_at，
  // 刷新后前端无法从接口区分「已撤回」与「普通草稿」。故本地持久化已撤回 id，
  // 供刷新/重进页面后重拉列表（fetchRecords）时强制保持「已撤回、不可编辑、可删除」态。
  // 注：这是同页 UI 状态恢复（撤回语义标记），非跨页面结构化数据传递，符合 CLAUDE.md 2.11。
  const WITHDRAWN_KEY = 'submission:withdrawnIds'
  const withdrawnIds = ref<string[]>(loadWithdrawnIds())

  function loadWithdrawnIds(): string[] {
    try {
      const raw = localStorage.getItem(WITHDRAWN_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  }

  function persistWithdrawnIds() {
    try {
      localStorage.setItem(WITHDRAWN_KEY, JSON.stringify(withdrawnIds.value))
    } catch {
      /* localStorage 不可用（隐私模式等）时退化为会话内标记 */
    }
  }

  async function fetchRecords(filters?: SubmissionFilters): Promise<void> {
    loading.value = true
    loadError.value = false
    try {
      if (records.value.length === 0)
        records.value = applyWithdrawnMarks(await getSubmissionRecords())
      filteredRecords.value = applyWithdrawnMarks(
        filters ? await getSubmissionRecords(filters) : records.value,
      )
    } catch {
      // 异常已由全局请求拦截器统一提示；此处置错误态供页面展示，保留已加载记录不清空
      loadError.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * 撤回提交记录：调 6.5 PUT /activities/{type}/{id}/withdraw（后端置 status=0 草稿）。
   * 撤回语义为撤销本次申报——记录仅保留 查看/删除，不再允许编辑；
   * 后端把撤回落库为草稿（can_edit=true），故本地置「已撤回」态并记入 withdrawnIds，
   * 供重拉列表（fetchRecords）时强制保持不可编辑。
   */
  async function withdrawRecord(id: string): Promise<void> {
    const rec = getRecordById(id)
    await withdrawSubmission(id, rec ? activityCategoryOf(rec.type) : 'archive')
    if (!withdrawnIds.value.includes(id)) {
      withdrawnIds.value.push(id)
      persistWithdrawnIds()
    }
    updateLocalStatus(id, 'withdrawn')
  }

  /** 将已撤回记录重新置为「已撤回、不可编辑、可删除」态（后端撤回后为 status=0 草稿，重拉会回退为可编辑） */
  function applyWithdrawnMarks(list: SubmissionRecord[]): SubmissionRecord[] {
    if (withdrawnIds.value.length === 0) return list
    for (const r of list) {
      if (withdrawnIds.value.includes(r.id)) {
        r.status = 'withdrawn'
        r.canEdit = false
        r.canDelete = true
      }
    }
    return list
  }

  /**
   * 删除提交记录：调 6.4 DELETE /activities/{id}?type=（按记录类型推导分类），
   * 成功后才移除本地记录；失败抛出交由调用方提示，本地记录保留。
   */
  async function deleteSubmission(id: string): Promise<void> {
    const rec = getRecordById(id)
    await deleteActivity(Number(id), rec ? activityCategoryOf(rec.type) : 'archive')
    // 删除已撤回记录时同步清理持久化标记，避免遗留脏 id
    const wi = withdrawnIds.value.indexOf(id)
    if (wi >= 0) {
      withdrawnIds.value.splice(wi, 1)
      persistWithdrawnIds()
    }
    removeRecord(id)
  }

  function updateLocalStatus(id: string, newStatus: string) {
    // 撤回语义为撤销申报：撤回后不可再编辑，仅可查看/删除（对应后端撤回置草稿但前端不放开编辑）
    const patch: Partial<SubmissionRecord> = { status: newStatus as any }
    if (newStatus === 'withdrawn') {
      patch.canEdit = false
      patch.canDelete = true
    }
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx >= 0) records.value[idx] = { ...records.value[idx], ...patch }
    const fIdx = filteredRecords.value.findIndex((r) => r.id === id)
    if (fIdx >= 0) filteredRecords.value[fIdx] = { ...filteredRecords.value[fIdx], ...patch }
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
    loadError,
    fetchRecords,
    withdrawRecord,
    deleteSubmission,
    updateLocalStatus,
    addRecord,
    removeRecord,
    getRecordById,
  }
})
