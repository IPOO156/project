import type { Ref } from 'vue'
import { ref } from 'vue'
import { getSemesters } from '@/shared/api/common'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'

/** 学期下拉选项：value 取后端 semester.name（字符串，如 '2024-2025-1'），与表单绑定/提交映射一致 */
export interface SemesterSelectOption {
  value: string
  label: string
}

export interface UseSemestersReturn {
  /** 学期下拉选项（后端学期 ∪ 本地生成区间的并集）；请求失败或返回空数组时退化为本地列表，保证始终有可选项 */
  semesterOptions: Ref<SemesterSelectOption[]>
  /** 是否正在请求中 */
  loading: Ref<boolean>
  /** 回退标记：null 表示已并入后端数据，否则为退化为本地列表的原因 */
  error: Ref<string | null>
  /** 触发首次拉取；已拉取过则直接复用缓存，不再发请求 */
  load: () => Promise<void>
  /** 强制重新拉取 */
  reload: () => Promise<void>
}

// 本地生成区间（2022-2028）映射为下拉选项，作为历史/未来学期的兜底数据源
const LOCAL_SEMESTERS: SemesterSelectOption[] = SEMESTER_OPTIONS.map((s) => ({
  value: s.value,
  label: s.label,
}))

// ── 模块级缓存：多个页面共用同一次请求 ──
// 首个调用者触发请求，其余页面复用同一个 in-flight Promise，避免 16 个页面各发一次请求。
const semesterOptions = ref<SemesterSelectOption[]>([...LOCAL_SEMESTERS])
const loading = ref(false)
const error = ref<string | null>(null)
let inflight: Promise<void> | null = null
let settled = false

/**
 * 后端学期 ∪ 本地生成区间的并集：后端学期是权威数据源，本地区间仅保证历史/未来学期可选，
 * 避免收窄用户可选项。按 name（value）去重，同名以后端 label 为准，最后按 name 升序排序。
 */
function buildUnion(remote: SemesterSelectOption[]): SemesterSelectOption[] {
  const merged = new Map<string, SemesterSelectOption>()
  for (const s of LOCAL_SEMESTERS) merged.set(s.value, s)
  for (const s of remote) merged.set(s.value, s)
  return [...merged.values()].sort((a, b) => a.value.localeCompare(b.value))
}

// 请求失败或返回空数组时退化为本地生成列表，仅作可用性兜底（banner 不可用/为空）
function applyFallback(reason: string) {
  semesterOptions.value = [...LOCAL_SEMESTERS]
  error.value = reason
}

function request(): Promise<void> {
  if (inflight) return inflight
  loading.value = true
  const task = getSemesters()
    .then(
      (list) => {
        if (Array.isArray(list) && list.length > 0) {
          const remote = list.map((s) => ({ value: s.name, label: s.label || s.name }))
          semesterOptions.value = buildUnion(remote)
          error.value = null
          return
        }
        applyFallback('学期数据为空，已退化为本地列表')
      },
      (e: unknown) => {
        applyFallback(e instanceof Error ? e.message : '学期数据加载失败，已退化为本地列表')
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
 * 模块级缓存 + 一次性拉取：多个页面共用同一次请求。数据为后端学期 ∪ 本地生成区间的并集，
 * 后端学期为权威数据源；请求失败或返回空数组时退化为本地列表兜底，保证下拉始终有可选项。
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
