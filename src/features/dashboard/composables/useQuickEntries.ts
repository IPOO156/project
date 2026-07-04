import { BookOpen, Star, Trophy, Users } from 'lucide-vue-next'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'dashboard_quick_entries_history'
const MAX_HISTORY = 3

export interface QuickEntry {
  label: string
  path: string
  icon: typeof Trophy
  color: string
  isRecent?: boolean
}

const baseEntries: QuickEntry[] = [
  { label: '学科竞赛', path: '/applications?tab=competition', icon: Trophy, color: '#e74c3c' },
  { label: '社会实践', path: '/applications?tab=social-practice', icon: Users, color: '#3498db' },
  { label: '奖学金', path: '/applications?tab=scholarship', icon: Star, color: '#f39c12' },
  { label: '成长时间轴', path: '/growth-timeline', icon: BookOpen, color: '#2ecc71' },
]

function readHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeHistory(history: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    // 隐私模式或存储已满时静默失败
  }
}

/**
 * 首页快捷入口推荐逻辑
 * - 基础入口固定展示。
 * - 基于 localStorage 记录最近点击路径，高频入口排序靠前。
 * - 提供最近使用标识与点击记录能力。
 */
export function useQuickEntries() {
  const history = ref<string[]>(readHistory())

  const recentPaths = computed(() => new Set(history.value))

  const quickEntries = computed<QuickEntry[]>(() => {
    const scored = baseEntries.map((entry) => {
      const idx = history.value.indexOf(entry.path)
      return {
        ...entry,
        score: idx === -1 ? Infinity : idx,
        isRecent: idx !== -1,
      }
    })
    return scored.sort((a, b) => a.score - b.score)
  })

  function recordClick(path: string) {
    const next = [path, ...history.value.filter((p) => p !== path)]
    history.value = next.slice(0, MAX_HISTORY)
    writeHistory(history.value)
  }

  function isRecent(path: string) {
    return recentPaths.value.has(path)
  }

  return {
    quickEntries,
    recordClick,
    isRecent,
  }
}
