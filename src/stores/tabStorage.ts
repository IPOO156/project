import type { Component } from 'vue'
import type { Router } from 'vue-router'
import { USER_INFO_CACHE_KEY } from '@/shared/constants/storageKeys'

/**
 * 标签栏的持久化层（sessionStorage 读写 + 脏数据校正）。
 * 从 useTabsStore 抽出，避免单个 Store 文件超 200 行。
 */

const STORAGE_KEY = 'app:visited-tabs'
export const MAX_TABS = 7

export interface NavTab {
  /** 唯一 key（用 fullPath） */
  path: string
  /** 显示标题（来自 route.meta.title） */
  title: string
  /** 图标（来自菜单配置或路由 meta） */
  icon?: Component
  /** 是否可关闭（affix 为 false 时可关） */
  closable: boolean
  /** 是否为 fixed（来自 route.meta.affix，严格 === true） */
  affix: boolean
}

/** 按 path 去重，保留首次出现的 tab。 */
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
 * 读取 sessionStorage 并重新校验 affix（覆盖脏数据），
 * 同时剔除指向 redirect 记录的死标签（页面被合并后遗留的历史路径）。
 * ⚠️ 这个函数在 store 初始化时调用，此时 router 已注册（main.ts 先 app.use(router)）。
 */
export function readTabsStorage(router?: Router): NavTab[] {
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
    // 教师端不显示学生端首页标签（清除历史残留）
    let isTeacher = false
    try {
      const userCache = localStorage.getItem(USER_INFO_CACHE_KEY)
      isTeacher = userCache ? JSON.parse(userCache).loginType === 'teacher' : false
    } catch {
      isTeacher = false
    }
    const source = isTeacher ? parsed.filter((t) => t.path !== '/dashboard') : parsed
    return dedupeTabs(
      source.flatMap((t): NavTab[] => {
        const storedAffix = Boolean(t.affix)
        // 实时反查真实 affix：旧版本产生的脏数据会被自动修正
        let realAffix = storedAffix
        if (router) {
          try {
            const resolved = router.resolve(t.path)
            const leaf = resolved.matched[resolved.matched.length - 1]
            // 页面已合并为 redirect 记录（如 /teacher/role-selection/adjust 现指向账号与角色页）：
            // 这类记录解不出组件，标签点得动却永远唤不回原页面，属死标签，直接丢弃。
            // （纯 redirect 记录的 leaf.components 为 null，正常页面恒有组件）
            if (leaf != null && leaf.components == null) {
              return []
            }
            // 严格 === true，避免父级 meta 继承或弱类型 true
            realAffix = leaf?.meta?.affix === true
          } catch {
            // resolve 失败（路由已不存在），保留存储值
          }
        }
        return [
          {
            path: t.path,
            title: t.title,
            closable: !realAffix,
            affix: realAffix,
          } satisfies NavTab,
        ]
      }),
    )
  } catch {
    return []
  }
}

export function writeTabsStorage(tabs: NavTab[]) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  } catch {
    // sessionStorage 可能被禁用（隐私模式）—— 静默降级
  }
}
