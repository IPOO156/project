import { ref } from 'vue'

import { getDict } from '@/shared/api/common'

export interface RemoteDictOption {
  value: string
  label: string
}

/** 与后端字典 Caffeine 缓存时长对齐；到期后允许重新拉取 */
export const REMOTE_DICT_CACHE_TTL_MS = 5 * 60_000
/** 空结果/失败后的负缓存，避免每个页面挂载都重复请求 */
export const REMOTE_DICT_RETRY_AFTER_MS = 60_000
/** 连续请求异常达到阈值后，本会话停止自动请求，全部走常量兜底 */
export const REMOTE_DICT_MAX_FAILURES = 3

interface CacheEntry {
  items: RemoteDictOption[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<RemoteDictOption[] | null>>()
const negativeCache = new Map<string, number>()
let consecutiveFailures = 0

function cloneOptions(items: readonly RemoteDictOption[]): RemoteDictOption[] {
  return items.map((item) => ({ value: item.value, label: item.label }))
}

/** 过滤空值/空文案并按 value 去重，保持后端返回顺序（后端已按 sort 正序） */
function normalizeOptions(list: unknown): RemoteDictOption[] {
  if (!Array.isArray(list)) return []

  const result: RemoteDictOption[] = []
  const seen = new Set<string>()
  for (const raw of list) {
    if (raw == null || typeof raw !== 'object') continue
    const item = raw as { value?: unknown; label?: unknown }
    const value = item.value == null ? '' : String(item.value).trim()
    const label = item.label == null ? '' : String(item.label).trim()
    if (!value || !label || seen.has(value)) continue
    seen.add(value)
    result.push({ value, label })
  }
  return result
}

async function fetchDict(dictType: string): Promise<RemoteDictOption[] | null> {
  try {
    const items = normalizeOptions(await getDict(dictType))
    if (items.length) {
      cache.set(dictType, { items, fetchedAt: Date.now() })
      negativeCache.delete(dictType)
      consecutiveFailures = 0
      return items
    }
    negativeCache.set(dictType, Date.now())
    return null
  } catch {
    negativeCache.set(dictType, Date.now())
    consecutiveFailures += 1
    return null
  }
}

async function ensureDict(dictType: string, force: boolean): Promise<RemoteDictOption[] | null> {
  const cached = cache.get(dictType)
  if (!force && cached && Date.now() - cached.fetchedAt < REMOTE_DICT_CACHE_TTL_MS) {
    return cached.items
  }

  const running = inflight.get(dictType)
  if (running) return running

  if (!force) {
    if (consecutiveFailures >= REMOTE_DICT_MAX_FAILURES) return null
    const failedAt = negativeCache.get(dictType)
    if (failedAt != null && Date.now() - failedAt < REMOTE_DICT_RETRY_AFTER_MS) return null
  }

  const request = fetchDict(dictType).finally(() => {
    inflight.delete(dictType)
  })
  inflight.set(dictType, request)
  return request
}

/**
 * 业务下拉选项：后端字典优先，前端常量兜底。
 *
 * - 接口成功且返回非空：以后端为准（管理员在字典管理中维护的启用项）；
 * - 接口失败或返回空数组：保留 fallback，保证表单仍可填写；
 * - 同一 dictType 在缓存期内只请求一次，并发调用共享同一个 Promise。
 *
 * @param dictType 后端字典类型编码（如 award_level）
 * @param fallback 前端常量选项（取值需与后端 dictionaries 表一致）
 */
export function useRemoteDict(dictType: string, fallback: readonly RemoteDictOption[]) {
  const options = ref<RemoteDictOption[]>(cloneOptions(fallback))

  async function load() {
    const items = await ensureDict(dictType, false)
    if (items) options.value = cloneOptions(items)
  }

  async function reload() {
    cache.delete(dictType)
    negativeCache.delete(dictType)
    consecutiveFailures = 0
    const items = await ensureDict(dictType, true)
    if (items) options.value = cloneOptions(items)
  }

  return { options, load, reload }
}

/** 清空模块级缓存（单测隔离；字典管理保存后如需强制刷新也可调用） */
export function clearRemoteDictCache(dictType?: string) {
  if (dictType) {
    cache.delete(dictType)
    negativeCache.delete(dictType)
    return
  }
  cache.clear()
  negativeCache.clear()
  inflight.clear()
  consecutiveFailures = 0
}
