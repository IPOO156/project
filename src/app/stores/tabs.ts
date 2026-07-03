import type { Router } from 'vue-router'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

/**
 * 已访问页面 tab 状态
 *  - 记录用户访问过的路由（持久化到 sessionStorage，刷新不丢）
 *  - 当前激活 tab
 *  - 上限 12 个，超出按 FIFO 淘汰最早的（affix 永不淘汰）
 *
 * 规则引用：.cursor/rules/03-state-and-dataflow.mdc §2
 *  - 不在 actions 里操作 router/DOM（路由切换由 useTabs hook 处理）
 *  - 不在 localStorage 存结构化数据（仅用 sessionStorage）
 *
 * affix 来源：route.meta.affix（配置驱动），不是访问顺序。
 * ⚠️ 重要：readStorage() 被 store 初始化调用时，sessionStorage 中的旧脏数据
 *   （旧版本 "第一个访问 = affix" 逻辑产生的数据）会被实时反查修正。
 */

const STORAGE_KEY = 'app:visited-tabs'
const MAX_TABS = 7

export interface NavTab {
  /** 唯一 key（用 fullPath） */
  path: string
  /** 显示标题（来自 route.meta.title） */
  title: string
  /** 是否可关闭（affix 为 false 时可关） */
  closable: boolean
  /** 是否为 fixed（来自 route.meta.affix，严格 === true） */
  affix: boolean
}

/**
 * 按 path 去重，保留第一次出现的 tab（用于清理持久化层旧脏数据）。
 */
function dedupeTabs(tabs: NavTab[]): NavTab[] {
  const seen = new Set<string>()
  return tabs.filter((tab) => {
    if (seen.has(tab.path)) {
      return false
    }
    seen.add(tab.path)
    return true
  })
}

/**
 * 读取 sessionStorage 并重新校验 affix（覆盖脏数据）。
 * ⚠️ 这个函数在 store 初始化时调用，此时 router 已注册（main.ts 先 app.use(router)）。
 */
function readStorage(router?: Router): NavTab[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as NavTab[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return dedupeTabs(
      parsed.map((t) => {
        const storedAffix = Boolean(t.affix)
        // 实时反查真实 affix：旧版本产生的脏数据会被自动修正
        let realAffix = storedAffix
        if (router) {
          try {
            const resolved = router.resolve(t.path)
            const leaf = resolved.matched[resolved.matched.length - 1]
            // 严格 === true，避免父级 meta 继承或弱类型 true
            realAffix = leaf?.meta?.affix === true
          } catch {
            // resolve 失败（路由已不存在），保留存储值
          }
        }
        return {
          path: t.path,
          title: t.title,
          closable: !realAffix,
          affix: realAffix,
        } satisfies NavTab
      }),
    )
  } catch {
    return []
  }
}

function writeStorage(tabs: NavTab[]) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  } catch {
    // sessionStorage 可能被禁用（隐私模式）—— 静默降级
  }
}

/**
 * ⚠️ 全局 router 实例引用（用于 readStorage 实时反查 affix）。
 * 在 main.ts 中，tabsStore 实例化之前，tabsStore.initRouter() 会被调用。
 */
let _router: Router | undefined

export const useTabsStore = defineStore('tabs', () => {
  // state（store 实例化时，router 必然已注册）
  const visitedTabs = ref<NavTab[]>(readStorage(_router))
  const activePath = ref<string>('')

  // getters
  const hasTabs = computed(() => visitedTabs.value.length > 0)

  // actions
  /**
   * 添加 tab。
   * @returns true：tab 已存在或添加成功；false：已达上限且为新 tab，未添加。
   */
  function addTab(tab: NavTab): boolean {
    // 防止重复添加
    if (visitedTabs.value.some((t) => t.path === tab.path)) {
      return true
    }
    // 超出上限：不再自动淘汰，由调用方提示用户手动清理
    if (visitedTabs.value.length >= MAX_TABS) {
      return false
    }
    visitedTabs.value.push(tab)
    return true
  }

  function removeTab(path: string) {
    const idx = visitedTabs.value.findIndex((t) => t.path === path)
    if (idx === -1) {
      return ''
    }
    const target = visitedTabs.value[idx]
    if (!target.closable) {
      return ''
    }
    visitedTabs.value.splice(idx, 1)
    // 关闭后建议下一个 tab：优先选被关闭 tab 的前一个
    const fallback = visitedTabs.value[idx - 1] ?? visitedTabs.value[0]
    return fallback?.path ?? ''
  }

  function removeOtherTabs(path: string) {
    visitedTabs.value = visitedTabs.value.filter((t) => t.path === path || !t.closable)
  }

  function removeAllTabs() {
    // 保留所有 affix
    visitedTabs.value = visitedTabs.value.filter((t) => !t.closable)
    return visitedTabs.value[0]?.path ?? ''
  }

  function setActive(path: string) {
    activePath.value = path
  }

  /**
   * 清除持久化数据（用于登出 / 测试 / 修复脏数据）
   */
  function clearAll() {
    visitedTabs.value = []
    activePath.value = ''
  }

  // 持久化：tabs 变化时同步到 sessionStorage
  watch(
    visitedTabs,
    (tabs) => {
      writeStorage(tabs)
    },
    { deep: true },
  )

  return {
    visitedTabs,
    activePath,
    hasTabs,
    addTab,
    removeTab,
    removeOtherTabs,
    removeAllTabs,
    setActive,
    clearAll,
  }
})

/**
 * 在 main.ts 中，tabsStore 实例化之前调用：
 *   import { useTabsStore } from '@/app/stores/tabs'
 *   import router from '@/app/router'
 *   const tabsStore = useTabsStore()
 *   tabsStore.initRouter(router)
 *
 * 这样 readStorage() 执行时就能拿到真实的 router.resolve() 能力。
 */
export function initTabsRouter(router: Router) {
  _router = router
}
