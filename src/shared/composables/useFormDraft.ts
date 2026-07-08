/**
 * 表单草稿自动保存 composable
 *
 * - 页面加载时静默恢复草稿（不弹窗，避免干扰表单渲染）
 * - 表单数据自动保存到 localStorage（防抖 800ms）
 * - 提交成功后调用 clearDraft() 删除草稿
 */

import { onMounted, watch } from 'vue'

const DRAFT_PREFIX = 'form_draft_'
const DEBOUNCE_MS = 800

/** 判断草稿数据是否有效（非全空） */
function isNonEmpty(data: Record<string, unknown>): boolean {
  return Object.values(data).some((v) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
}

export function useFormDraft(
  key: string,
  form: Record<string, unknown>,
  options?: { afterRestore?: () => void },
) {
  const storageKey = DRAFT_PREFIX + key
  let timer: ReturnType<typeof setTimeout> | undefined

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(form))
    } catch {
      // 存储满时静默失败
    }
  }

  /** 清除草稿 */
  function clearDraft() {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }

  /** 从 localStorage 静默恢复草稿到 form */
  function restoreDraft() {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const data = JSON.parse(raw) as Record<string, unknown>
      if (!isNonEmpty(data)) return
      Object.keys(data).forEach((k) => {
        if (k in form) {
          ;(form as Record<string, unknown>)[k] = data[k]
        }
      })
    } catch {
      // 解析失败则忽略
    }
  }

  onMounted(() => {
    restoreDraft()
    options?.afterRestore?.()
  })

  // 监听表单变化，防抖自动保存
  watch(
    () => form,
    () => {
      clearTimeout(timer)
      timer = setTimeout(save, DEBOUNCE_MS)
    },
    { deep: true, flush: 'post' },
  )

  return { clearDraft }
}
