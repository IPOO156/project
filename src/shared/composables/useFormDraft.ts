import { ElMessageBox } from 'element-plus'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { deleteDraft, loadDraft, saveDraft } from '@/shared/api/submission'

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
  },
) {
  const storageKey = DRAFT_PREFIX + key
  const enableBackend = options?.enableBackend !== false
  const enableLeaveGuard = options?.enableLeaveGuard !== false
  const autoRestore = options?.autoRestore !== false
  let timer: ReturnType<typeof setTimeout> | undefined
  let hasDirtyData = false

  function saveLocal() {
    // 空表单不写 localStorage：保存草稿后清空表单会触发深 watcher，不能因此抹掉已存草稿
    if (!isNonEmpty(form)) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(form))
    } catch {
      /* ignore */
    }
  }
  async function saveToBackend() {
    if (!enableBackend) return
    try {
      await saveDraft(key, { ...form })
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
    if (enableBackend) {
      try {
        await deleteDraft(key)
      } catch {
        /* ignore */
      }
    }
    hasDirtyData = false
  }

  function saveNow() {
    clearTimeout(timer)
    saveLocal()
    if (enableBackend) saveToBackend()
    hasDirtyData = true
  }

  async function restoreDraft() {
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
    if (enableBackend) {
      try {
        const backendData = await loadDraft(key)
        if (backendData && isNonEmpty(backendData)) {
          Object.keys(backendData).forEach((k) => {
            if (k in form) Object.assign(form, { [k]: backendData[k] })
          })
        }
      } catch {
        /* ignore */
      }
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

  return { clearDraft, saveNow, hasDirtyData: () => hasDirtyData }
}
