import type { Component } from 'vue'
import type { MenuItem } from '@/shared/config/moduleRegistry'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { getMenuItems } from '@/shared/config/moduleRegistry'

const STORAGE_KEYS = {
  history: 'dashboard_quick_entries_history',
  pool: 'dashboard_quick_entries_pool',
  order: 'dashboard_quick_entries_order',
  hidden: 'dashboard_quick_entries_hidden',
} as const

const VERSION_KEY = 'dashboard_quick_entries_version'
const CURRENT_VERSION = 1

const MAX_HISTORY = 3
const VISIBLE_COUNT = 6

export interface QuickEntry {
  id: string
  label: string
  path: string
  icon: Component
  color: string
  bgColor: string
  isRecent?: boolean
  hidden?: boolean
  order?: number
}

// 统一亮度/饱和度的 HSL 色相，避免不同入口图标明暗不均
const ENTRY_COLORS = [
  'hsl(0, 70%, 52%)',
  'hsl(30, 70%, 52%)',
  'hsl(60, 70%, 52%)',
  'hsl(90, 70%, 52%)',
  'hsl(120, 70%, 52%)',
  'hsl(150, 70%, 52%)',
  'hsl(180, 70%, 52%)',
  'hsl(210, 70%, 52%)',
  'hsl(240, 70%, 52%)',
  'hsl(270, 70%, 52%)',
  'hsl(300, 70%, 52%)',
  'hsl(330, 70%, 52%)',
]

function withAlpha(color: string, alpha: number): string {
  return color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`)
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 隐私模式或存储已满时静默失败
  }
}

function readHistory(): string[] {
  return readJson<string[]>(STORAGE_KEYS.history, [])
}

function writeHistory(history: string[]) {
  writeJson(STORAGE_KEYS.history, history.slice(0, MAX_HISTORY))
}

function flattenMenuItems(items: MenuItem[], result: MenuItem[] = []): MenuItem[] {
  for (const item of items) {
    if (item.path) result.push(item)
    if (item.children?.length) flattenMenuItems(item.children, result)
  }
  return result
}

function buildBaseEntries(): QuickEntry[] {
  const menuItems = flattenMenuItems(getMenuItems())
  return menuItems
    .filter((item) => item.path && item.path !== '/dashboard' && item.icon)
    .map((item, index) => {
      const color = ENTRY_COLORS[index % ENTRY_COLORS.length]
      return {
        id: item.path!.replace(/\//g, '_'),
        label: item.label,
        path: item.path!,
        icon: item.icon!,
        color,
        bgColor: withAlpha(color, 0.12),
      }
    })
}

// 默认展示的快捷入口：优先选择最常用的 6 个页面
const DEFAULT_ENTRY_IDS = [
  'profile_info',
  'profile_career-plan',
  'awards',
  'messages',
  'growth-timeline',
  'applications',
]

function buildDefaultPool(): string[] {
  const entries = buildBaseEntries()
  const defaultIds = DEFAULT_ENTRY_IDS.filter((id) => entries.some((e) => e.id === id))

  // 若指定默认入口不足 6 个，从剩余可用入口中补齐
  if (defaultIds.length < VISIBLE_COUNT) {
    const remaining = entries
      .filter((e) => !defaultIds.includes(e.id))
      .slice(0, VISIBLE_COUNT - defaultIds.length)
      .map((e) => e.id)
    defaultIds.push(...remaining)
  }

  return defaultIds.slice(0, VISIBLE_COUNT)
}

/**
 * 快捷入口 localStorage 版本迁移
 * 版本不一致时清空旧缓存，确保新默认入口和全路由候选池生效
 */
function migrateStorage() {
  if (typeof window === 'undefined') return
  const savedVersion = Number.parseInt(localStorage.getItem(VERSION_KEY) ?? '0', 10)
  if (savedVersion === CURRENT_VERSION) return

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION))
}

/**
 * 首页快捷入口推荐与自定义逻辑
 * - 候选池取自全部菜单路由，首页最多展示 6 个。
 * - 刷新按钮仅对当前已选中的入口随机排序，不会引入未选入口。
 * - 支持拖拽自定义顺序与显示/隐藏不常用入口。
 * - 基于 localStorage 记录最近点击路径，高频入口排序靠前。
 */
export function useQuickEntries() {
  migrateStorage()
  const baseEntries = buildBaseEntries()
  const history = ref<string[]>(readHistory())
  const poolIds = ref<string[]>(readJson<string[]>(STORAGE_KEYS.pool, buildDefaultPool()))
  const userOrder = ref<Record<string, number>>(
    readJson<Record<string, number>>(STORAGE_KEYS.order, {}),
  )
  const hiddenIds = ref<Set<string>>(new Set(readJson<string[]>(STORAGE_KEYS.hidden, [])))

  const recentPaths = computed(() => new Set(history.value))

  const visibleEntries = computed<QuickEntry[]>(() => {
    const visiblePool = poolIds.value.filter((id) => !hiddenIds.value.has(id))

    return visiblePool
      .map((id) => baseEntries.find((e) => e.id === id))
      .filter((e): e is QuickEntry => !!e)
      .map((entry) => {
        const idx = history.value.indexOf(entry.path)
        return {
          ...entry,
          score: userOrder.value[entry.id] ?? (idx === -1 ? Infinity : idx),
          isRecent: idx !== -1,
        }
      })
      .sort((a, b) => {
        // 优先按用户自定义顺序，其次按最近使用，最后按默认顺序
        const orderA = userOrder.value[a.id] ?? Infinity
        const orderB = userOrder.value[b.id] ?? Infinity
        if (orderA !== orderB) return orderA - orderB
        const recentA = history.value.indexOf(a.path)
        const recentB = history.value.indexOf(b.path)
        if (recentA !== recentB)
          return (recentA === -1 ? Infinity : recentA) - (recentB === -1 ? Infinity : recentB)
        return (
          baseEntries.findIndex((e) => e.id === a.id) - baseEntries.findIndex((e) => e.id === b.id)
        )
      })
  })

  const hiddenEntries = computed<QuickEntry[]>(() => {
    return baseEntries.filter((e) => hiddenIds.value.has(e.id))
  })

  const allEntries = computed<QuickEntry[]>(() => {
    return baseEntries.map((entry) => {
      const idx = history.value.indexOf(entry.path)
      return {
        ...entry,
        isRecent: idx !== -1,
        hidden: hiddenIds.value.has(entry.id),
      }
    })
  })

  function refreshPool() {
    // 刷新行为：仅对当前已选中的入口随机排序，不引入未选入口
    const current = visibleEntries.value.map((e) => e.id)
    if (current.length === 0) {
      ElMessage.info('当前没有可见入口')
      return
    }

    const shuffled = [...current].sort(() => Math.random() - 0.5)
    poolIds.value = shuffled
    writeJson(STORAGE_KEYS.pool, shuffled)

    const orderMap: Record<string, number> = {}
    shuffled.forEach((id, index) => {
      orderMap[id] = index
    })
    userOrder.value = orderMap
    writeJson(STORAGE_KEYS.order, orderMap)

    ElMessage.success('已随机刷新入口顺序')
  }

  function toggleHidden(id: string) {
    const isHidden = hiddenIds.value.has(id)

    if (isHidden) {
      // 将入口添加到首页：先校验是否超过数量上限，避免 hiddenIds 与 poolIds 状态不一致
      const currentVisible = poolIds.value.filter((pid) => !hiddenIds.value.has(pid))
      if (currentVisible.length >= VISIBLE_COUNT) {
        ElMessage.warning(`首页快捷入口最多保留 ${VISIBLE_COUNT} 个，请先删除其他入口`)
        return
      }

      const nextHidden = new Set(hiddenIds.value)
      nextHidden.delete(id)
      hiddenIds.value = nextHidden
      writeJson(STORAGE_KEYS.hidden, Array.from(nextHidden))

      const newPool = [id, ...currentVisible]
      poolIds.value = newPool
      writeJson(STORAGE_KEYS.pool, newPool)

      const orderMap: Record<string, number> = {}
      newPool.forEach((pid, index) => {
        orderMap[pid] = index
      })
      userOrder.value = orderMap
      writeJson(STORAGE_KEYS.order, orderMap)
    } else {
      // 将入口从首页移除
      const nextHidden = new Set(hiddenIds.value)
      nextHidden.add(id)

      if (baseEntries.length - nextHidden.size <= 0) {
        ElMessage.warning('至少保留一个可见入口')
        return
      }

      hiddenIds.value = nextHidden
      writeJson(STORAGE_KEYS.hidden, Array.from(nextHidden))
    }
  }

  function updateOrder(orderedIds: string[]) {
    const orderMap: Record<string, number> = {}
    orderedIds.forEach((id, index) => {
      orderMap[id] = index
    })
    userOrder.value = orderMap
    writeJson(STORAGE_KEYS.order, orderMap)
  }

  function recordClick(path: string) {
    const next = [path, ...history.value.filter((p) => p !== path)]
    history.value = next.slice(0, MAX_HISTORY)
    writeHistory(history.value)
  }

  function isRecent(path: string) {
    return recentPaths.value.has(path)
  }

  function resetToDefault() {
    poolIds.value = buildDefaultPool()
    userOrder.value = {}
    hiddenIds.value = new Set()
    writeJson(STORAGE_KEYS.pool, poolIds.value)
    writeJson(STORAGE_KEYS.order, {})
    writeJson(STORAGE_KEYS.hidden, [])
  }

  return {
    visibleEntries,
    hiddenEntries,
    allEntries,
    refreshPool,
    toggleHidden,
    updateOrder,
    recordClick,
    isRecent,
    resetToDefault,
  }
}
