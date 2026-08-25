import { ElMessageBox } from 'element-plus'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { autosaveApplication } from '@/shared/api/applications'
import { autosaveAward } from '@/shared/api/awards'
import { activityCategoryOf, buildContractPayload, createDraft } from '@/shared/api/submission'

const DRAFT_PREFIX = 'form_draft_'
const DEBOUNCE_MS = 800

function isNonEmpty(data: Record<string, unknown>): boolean {
  return Object.values(data).some((v) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
}

export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  form: T,
  options?: {
    afterRestore?: () => void
    enableBackend?: boolean
    enableLeaveGuard?: boolean
    /** 挂载时是否自动把草稿回填进表单（默认 true）；申报页传 false：表单默认空白，草稿只通过下拉记录"编辑"回填 */
    autoRestore?: boolean
    /** 申报/报名类型 key（如 competition / competitionStar），用于区分档案 autosaveApplication 与奖项 autosaveAward */
    type?: string
  },
) {
  const storageKey = DRAFT_PREFIX + key
  const enableBackend = options?.enableBackend !== false
  const enableLeaveGuard = options?.enableLeaveGuard !== false
  const autoRestore = options?.autoRestore !== false
  const applicationType = options?.type ?? key
  // 档案类走 /applications/{archiveId}/autosave，奖项之星类走 /awards/{applicationId}/autosave
  const category = activityCategoryOf(applicationType as any)
  let timer: ReturnType<typeof setTimeout> | undefined
  let hasDirtyData = false

  function saveLocal() {
    // 空表单不写 localStorage：保存草稿后清空表单会触发深 watcher，不能因此抹掉已存草稿
    if (!isNonEmpty(form)) return
    try {
      const snapshot = { ...form }
      // 后端记录 id（archiveId/applicationId）由 setRecordId 维护，仅用于 autosave 寻址，不写入本地草稿内容
      delete (snapshot as any).archiveId
      delete (snapshot as any).applicationId
      localStorage.setItem(storageKey, JSON.stringify(snapshot))
    } catch {
      /* ignore */
    }
  }

  /** 当前待自动保存的后端记录 id（档案 archiveId / 奖项 applicationId），无则说明尚未在服务端建过草稿记录 */
  function currentId(): number | null {
    const raw = category === 'award' ? (form as any).applicationId : (form as any).archiveId
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  /** 回填/清除后端记录 id：首次建草稿成功后写入，重置表单或切换编辑记录时清除 */
  function setRecordId(id: number | null): void {
    if (category === 'award') {
      ;(form as any).applicationId = id == null ? undefined : id
    } else {
      ;(form as any).archiveId = id == null ? undefined : id
    }
  }

  /**
   * 草稿自动保存（7.0 PUT /applications/{archiveId}/autosave、8.1.1 PUT /awards/{applicationId}/autosave）。
   * 无 id 的新记录：先用对应 submit 接口（isDraft=1）建草稿并取回 id 回填表单；已有 id：直接走 autosave 增量保存。
   * 接口失败静默降级，不打断用户输入（本地 localStorage 已兜底）。
   */
  async function saveToBackend() {
    if (!enableBackend || !isNonEmpty(form)) return
    try {
      const id = currentId()
      if (id == null) {
        const created = await createDraft(applicationType, { ...form })
        if (created != null) setRecordId(created)
        return
      }
      const payload = await buildContractPayload(applicationType, { ...form, isDraft: 1 })
      if (category === 'award') await autosaveAward(id, payload)
      else await autosaveApplication(id, payload)
    } catch {
      /* ignore */
    }
  }
  function save() {
    saveLocal()
    hasDirtyData = true
    saveToBackend()
  }

  async function clearDraft() {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
    // 文档无草稿删除接口（7.0/8.1.1 仅有 autosave），此处仅清理本地 localStorage；
    // 后端草稿记录保留为 status=0，如需删除由动态记录模块 DELETE /activities/{activityId} 承担（见 useApplicationPage.removeRecord）
    setRecordId(null)
    hasDirtyData = false
  }

  function saveNow() {
    clearTimeout(timer)
    saveLocal()
    if (enableBackend) saveToBackend()
    hasDirtyData = true
  }

  async function restoreDraft() {
    // 文档无草稿列表查询接口：后端草稿（status=0）随 GET /activities 一并返回，
    // 故此处仅从 localStorage 恢复本地未提交内容；真实草稿的列表"编辑"回填由 useApplicationPage/useFormRecords 承担
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const data = JSON.parse(raw)
        if (isNonEmpty(data)) {
          Object.keys(data).forEach((k) => {
            if (k in form) Object.assign(form, { [k]: data[k] })
          })
        }
      }
    } catch {
      /* ignore */
    }
    options?.afterRestore?.()
  }

  onMounted(() => {
    if (autoRestore) restoreDraft()
  })
  watch(
    () => form,
    () => {
      clearTimeout(timer)
      timer = setTimeout(save, DEBOUNCE_MS)
    },
    { deep: true, flush: 'post' },
  )

  function promptUnsaved(): Promise<boolean> {
    return new Promise((resolve) => {
      ElMessageBox.confirm('您有未保存的草稿内容，是否保存后离开？', '未保存提示', {
        confirmButtonText: '保存并离开',
        cancelButtonText: '继续编辑',
        distinguishCancelAndClose: true,
        type: 'warning',
      })
        .then(() => {
          saveNow()
          resolve(true)
        })
        .catch((action: string) => {
          if (action === 'close') {
            ElMessageBox.confirm('清空草稿后将丢失数据，确定清空吗？', '清空确认', {
              confirmButtonText: '清空草稿',
              cancelButtonText: '取消',
              type: 'warning',
            })
              .then(() => {
                clearDraft()
                resolve(true)
              })
              .catch(() => resolve(false))
          } else {
            resolve(false)
          }
        })
    })
  }

  if (enableLeaveGuard) {
    onBeforeRouteLeave(async (_to, _from, next) => {
      if (!hasDirtyData) {
        next()
        return
      }
      const ok = await promptUnsaved()
      ok ? next() : next(false)
    })
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (hasDirtyData) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  if (enableLeaveGuard && typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
    onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))
  }

  return { clearDraft, saveNow, setRecordId, hasDirtyData: () => hasDirtyData }
}
