import type { ApplicationType } from '@/shared/types/types'
import { ElMessageBox } from 'element-plus'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { autosaveApplication } from '@/shared/api/applications'
import { autosaveAward } from '@/shared/api/awards'
import { activityCategoryOf, buildContractPayload, createDraft } from '@/shared/api/submission'
import { DRAFT_PREFIX } from '@/shared/constants/storageKeys'
import { scopedStorageKey } from '@/shared/utils/storageScope'

const DEBOUNCE_MS = 800

function isNonEmpty(data: Record<string, unknown>): boolean {
  return Object.values(data).some((v) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
}

/** 单字段是否为空（undefined/null/''/空数组）——与 useApplicationPage 必填校验判定一致 */
function fieldEmpty(v: unknown): boolean {
  return v == null || v === '' || (Array.isArray(v) && v.length === 0)
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
    /**
     * 新建后端草稿（isDraft=1）前必须非空的字段 key（通常为各类型页必填字段）。
     * 扩展表含 NOT NULL 列（如 archive_competitions.competition_type/award_level），
     * 必填字段缺失时 POST 会被后端以 409「数据校验失败」拦截并全局弹错；
     * 传入后，字段未齐全时跳过建草稿，仅本地 localStorage 兜底（表单填齐后自动建草稿）。
     */
    minDraftFields?: string[]
  },
) {
  // 按登录用户隔离：换账号登录时不能读到上一个学生的草稿
  const storageKey = scopedStorageKey(DRAFT_PREFIX + key)
  const enableBackend = options?.enableBackend !== false
  const enableLeaveGuard = options?.enableLeaveGuard !== false
  const autoRestore = options?.autoRestore !== false
  const applicationType = options?.type ?? key
  const minDraftFields = options?.minDraftFields
  // 档案类走 /applications/{archiveId}/autosave，奖项之星类走 /awards/{applicationId}/autosave
  // applicationType 由各类型页常量传入（对应 ApplicationType）
  const category = activityCategoryOf(applicationType as ApplicationType)
  let timer: ReturnType<typeof setTimeout> | undefined
  let hasDirtyData = false
  // 本地草稿写入版本：后端保存是异步的，只有期间没有更新的本地内容时才允许删除本地副本，
  // 否则会把用户刚输入、尚未落后端的内容清掉
  let localDraftVersion = 0

  function saveLocal() {
    // 空表单不写 localStorage：保存草稿后清空表单会触发深 watcher，不能因此抹掉已存草稿
    if (!isNonEmpty(form)) return
    try {
      const snapshot: Record<string, unknown> = { ...form }
      // 后端记录 id（archiveId/applicationId）由 setRecordId 维护，不写入草稿内容；
      // 但把 id 记到 __backendId 供列表合并时识别「本地草稿 = 某条后端草稿」，
      // 避免同一份草稿在记录列表里显示成两行。
      delete snapshot.archiveId
      delete snapshot.applicationId
      const id = currentId()
      if (id != null) snapshot.__backendId = id
      localStorage.setItem(storageKey, JSON.stringify(snapshot))
      localDraftVersion += 1
    } catch {
      /* ignore */
    }
  }

  /** 后端已落库后删除本地草稿副本；表单内的后端 id 保留，后续 autosave 仍指向同一条记录 */
  function removeLocalDraft() {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      /* ignore */
    }
  }

  /** 当前待自动保存的后端记录 id（档案 archiveId / 奖项 applicationId），无则说明尚未在服务端建过草稿记录 */
  function currentId(): number | null {
    const raw = category === 'award' ? form.applicationId : form.archiveId
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  /** 回填/清除后端记录 id：首次建草稿成功后写入，重置表单或切换编辑记录时清除 */
  function setRecordId(id: number | null): void {
    // 表单类型 T 由各页 emptyForm 决定，后端记录 id 字段未必在其已知键内，按动态键写入
    const target = form as Record<string, unknown>
    if (category === 'award') {
      target.applicationId = id == null ? undefined : id
    } else {
      target.archiveId = id == null ? undefined : id
    }
  }

  /**
   * 草稿自动保存（7.0 PUT /applications/{archiveId}/autosave、8.1.1 PUT /awards/{applicationId}/autosave）。
   * 无 id 的新记录：先用对应 submit 接口（isDraft=1）建草稿并取回 id 回填表单；已有 id：直接走 autosave 增量保存。
   * 接口失败静默降级，不打断用户输入（本地 localStorage 已兜底）。
   * 返回是否已把当前内容落到服务端（未开启/字段不齐/接口失败均为 false）。
   */
  async function saveToBackend(): Promise<boolean> {
    if (!enableBackend || !isNonEmpty(form)) return false
    const version = localDraftVersion
    try {
      const id = currentId()
      if (id == null) {
        // 扩展表含 NOT NULL 列，必填字段缺失时后端会以 409 拒绝建草稿；此时仅本地保存，填齐后自动建草稿
        if (minDraftFields?.some((k) => fieldEmpty(form[k]))) return false
        const created = await createDraft(applicationType, { ...form })
        if (created == null) return false
        setRecordId(created)
        // 后端草稿已生成：本地副本与其是同一份，删除后列表只剩后端这一条。
        // 若请求期间又有新的本地写入，保留本地副本，等下一次保存处理。
        if (localDraftVersion === version) removeLocalDraft()
        return true
      }
      const payload = await buildContractPayload(applicationType, { ...form, isDraft: 1 })
      if (category === 'award') await autosaveAward(id, payload)
      else await autosaveApplication(id, payload)
      // 自动保存成功即后端已是最新内容，本地副本不再需要
      if (localDraftVersion === version) removeLocalDraft()
      return true
    } catch {
      // 保存失败保留本地草稿兜底；列表按 __backendId 识别，不会与后端草稿重复展示
      return false
    }
  }
  function save() {
    saveLocal()
    // 仅当表单实际有内容才标记脏数据：空白表单（如保存草稿/提交后 resetForm 触发深 watcher）不弹离开提示
    hasDirtyData = isNonEmpty(form)
    void saveToBackend()
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

  /**
   * 立即保存（本地同步写入 + 后端异步落库）。返回后端是否保存成功，
   * 调用方（保存草稿）可 await 后再刷新列表，避免刷新时后端草稿还没建出来。
   */
  async function saveNow(): Promise<boolean> {
    clearTimeout(timer)
    saveLocal()
    const backendSaved = enableBackend ? await saveToBackend() : false
    hasDirtyData = isNonEmpty(form)
    return backendSaved
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
          // 离开页面不等待后端响应：本地草稿已同步写入，后端落库在后台继续
          void saveNow()
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
      // 表单空白（含保存草稿/提交后的重置态、防抖窗口内）不弹未保存提示，仅"填了内容"才拦截
      if (!hasDirtyData || !isNonEmpty(form)) {
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
