import type { Router } from 'vue-router'
import type { NavTab } from './tabStorage'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { MAX_TABS, readTabsStorage, writeTabsStorage } from './tabStorage'

/**
 * 已访问页面 tab 状态
 *  - 持久化到 sessionStorage，刷新不丢
 *  - 上限 7 个，affix 永不淘汰
 *
 * 规则：不在 actions 里操作 router/DOM；不在 localStorage 存结构化数据
 * affix 来源：route.meta.affix（配置驱动）
 * 持久化读写与脏数据校正见 ./tabStorage.ts
 */
export { MAX_TABS } from './tabStorage'
export type { NavTab } from './tabStorage'

/**
 * 全局 router 引用，main.ts 中通过 initTabsRouter() 注入
 */
let _router: Router | undefined

export const useTabsStore = defineStore('tabs', () => {
  const visitedTabs = ref<NavTab[]>(readTabsStorage(_router))
  const activePath = ref<string>('')

  const hasTabs = computed(() => visitedTabs.value.length > 0)

  /**
   * 添加标签，超过上限时自动淘汰最早的非固定标签
   * @returns 添加结果：true 成功；false 表示未添加（应被调用方降级处理）
   */
  function addTab(tab: NavTab): { ok: boolean; evicted?: NavTab } {
    // 已存在：直接更新（不重置位置）
    if (visitedTabs.value.some((t) => t.path === tab.path)) {
      return { ok: true }
    }
    // 固定标签永远不淘汰
    if (!tab.affix && visitedTabs.value.length >= MAX_TABS) {
      // 找到最早的可关闭标签（按数组顺序，固定标签在最前）
      const evictIdx = visitedTabs.value.findIndex((t) => !t.affix)
      if (evictIdx === -1) {
        return { ok: false }
      }
      const evicted = visitedTabs.value[evictIdx]
      visitedTabs.value.splice(evictIdx, 1)
      visitedTabs.value.push(tab)
      return { ok: true, evicted }
    }
    visitedTabs.value.push(tab)
    return { ok: true }
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
    const fallback = visitedTabs.value[idx - 1] ?? visitedTabs.value[0]
    return fallback?.path ?? ''
  }

  function removeOtherTabs(path: string) {
    visitedTabs.value = visitedTabs.value.filter((t) => t.path === path || !t.closable)
  }

  function removeAllTabs() {
    visitedTabs.value = visitedTabs.value.filter((t) => !t.closable)
    return visitedTabs.value[0]?.path ?? ''
  }

  function setActive(path: string) {
    activePath.value = path
  }

  /** 拖拽重新排序 tabs */
  function reorderTabs(newOrder: NavTab[]) {
    visitedTabs.value = newOrder
  }

  /** 清除持久化数据（用于登出 / 测试 / 修复脏数据） */
  function clearAll() {
    visitedTabs.value = []
    activePath.value = ''
  }

  // 持久化：tabs 变化时同步到 sessionStorage
  watch(
    visitedTabs,
    (tabs) => {
      writeTabsStorage(tabs)
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
    reorderTabs,
    clearAll,
  }
})

/** 在 main.ts 中 store 实例化前调用，注入 router 用于 readTabsStorage 反查 affix */
export function initTabsRouter(router: Router) {
  _router = router
}
