import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { getSemesters } from '@/shared/api/common'

/** 学期下拉选项：value 取后端 semester.name（字符串，如 '2024-2025-1'），与表单绑定/提交映射一致 */
export interface SemesterSelectOption {
  value: string
  label: string
}

export interface UseSemestersReturn {
  /** 学期下拉选项，仅含后端 `GET /common/semesters` 返回的真实学期 */
  semesterOptions: Ref<SemesterSelectOption[]>
  /** 是否正在请求中 */
  loading: Ref<boolean>
  /** 加载失败 / 后端未配置学期时的原因；null 表示数据正常 */
  error: Ref<string | null>
  /** 触发首次拉取；已拉取过则直接复用缓存，不再发请求 */
  load: () => Promise<void>
  /** 强制重新拉取 */
  reload: () => Promise<void>
}

// ── 模块级缓存：多个页面共用同一次请求 ──
// 首个调用者触发请求，其余页面复用同一个 in-flight Promise，避免 16 个页面各发一次请求。
const semesterOptions = ref<SemesterSelectOption[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let inflight: Promise<void> | null = null
let settled = false

function applyRemote(list: { name: string; label?: string }[]): void {
  semesterOptions.value = list
    .filter((s) => Boolean(s.name))
    .map((s) => ({ value: s.name, label: s.label || s.name }))
    .sort((a, b) => a.value.localeCompare(b.value))
  error.value = null
}

function applyEmpty(reason: string, notify: boolean): void {
  semesterOptions.value = []
  error.value = reason
  // 后端正常返回空数组时拦截器不会提示，需要就地告知；请求失败已由拦截器统一提示。
  if (notify) ElMessage.warning('学期数据未配置，请联系管理员')
}

function request(): Promise<void> {
  if (inflight) return inflight
  loading.value = true
  const task = getSemesters()
    .then(
      (list) => {
        if (Array.isArray(list) && list.length > 0) {
          applyRemote(list)
          return
        }
        applyEmpty('学期数据为空', true)
      },
      (e: unknown) => {
        applyEmpty(e instanceof Error ? e.message : '学期数据加载失败', false)
      },
    )
    .finally(() => {
      loading.value = false
      inflight = null
      settled = true
    })
  inflight = task
  return task
}

/**
 * 学期下拉数据源（对接后端 GET /common/semesters）。
 *
 * 只使用后端返回的学期，不再与本地生成区间取并集：提交时需用学期 name 映射 semesterId，
 * 后端不存在的学期即使能选中也必然提交失败（「未找到学期 / 学期不存在」），
 * 因此不允许在 UI 中编造可选项。
 *
 * 模块级缓存 + 一次性拉取：多个页面共用同一次请求。请求失败或返回空数组时下拉为空，
 * 原因写入 error，由页面/提示告知用户，不回退本地列表。
 */
export function useSemesters(): UseSemestersReturn {
  function load(): Promise<void> {
    if (settled) return Promise.resolve()
    return request()
  }

  function reload(): Promise<void> {
    settled = false
    return request()
  }

  return { semesterOptions, loading, error, load, reload }
}
