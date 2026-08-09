import type { Component } from 'vue'
import type { RouteLocationMatched, RouteLocationNormalized } from 'vue-router'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MAX_TABS, useTabsStore } from '@/app/stores/tabs'

import { findMenuItemByPath } from '@/shared/constants/menu'

/**
 * useTabs - 标签页状态桥接
 *
 * 职责：
 *  1. 监听路由变化 → 写入 useTabsStore
 *  2. 跳过 noLayout 路由（登录/错误页不入 tab）
 *  3. affix 由 route.meta.affix 决定（配置驱动，非行为驱动）
 *
 * 重要：affix 只从 **leaf route（最深层匹配路由）** 的 meta 读取，
 *   不能用 to.meta，因为 to.meta 是所有 matched 路由 meta 的浅合并，
 *   一旦父路由写了 affix，所有子路由都会被污染。
 *
 * 使用：
 *  - 在 DefaultLayout 中调用 useTabs() 一次即可
 *  - 不要在 NavTabs 内部调用（避免循环）
 */
export function useTabs() {
  const router = useRouter()
  const tabsStore = useTabsStore()

  // 防止标签上限警告在极短时间内重复弹出
  let lastWarningAt = 0
  const WARNING_DEBOUNCE_MS = 300

  /**
   * 严格判定 affix：仅当 meta.affix 严格等于 true 时才锁定。
   * - 拒绝 'true' / 1 / {} / [] 等弱类型 true
   * - 仅从 leaf matched 读取，避免父级污染
   */
  function resolveAffix(to: RouteLocationNormalized): boolean {
    const leaf: RouteLocationMatched | undefined = to.matched[to.matched.length - 1]
    if (!leaf) {
      return false
    }
    // ⚠️ 关键：必须 === true，Boolean() 太宽松
    return leaf.meta?.affix === true
  }

  function resolveTitle(to: RouteLocationNormalized): string {
    const leaf: RouteLocationMatched | undefined = to.matched[to.matched.length - 1]
    if (leaf?.meta?.title) {
      return String(leaf.meta.title)
    }
    return ''
  }

  /**
   * 根据路由路径匹配菜单图标。
   * - 优先从菜单配置中查找（与侧边栏保持一致）
   * - 未找到时返回 undefined，标签栏不显示图标
   */
  function resolveIcon(path: string): Component | undefined {
    const menuItem = findMenuItemByPath(path)
    return menuItem?.icon
  }

  function handleRoute(to: RouteLocationNormalized) {
    // 跳过：非 layout 路由（登录/错误页等）
    if (to.meta?.noLayout) {
      return
    }
    // 跳过：没有标题的路由
    const title = resolveTitle(to)
    if (!title) {
      return
    }
    // ✅ 严格 affix 判定（避免父级 meta 污染 + 弱类型 true）
    const affix = resolveAffix(to)
    // 个人档案信息申报使用 query 参数切换内部模块，合并为单个 tab
    const tabPath = to.path === '/applications' ? to.path : to.fullPath
    const result = tabsStore.addTab({
      path: tabPath,
      title,
      icon: resolveIcon(tabPath),
      closable: !affix,
      affix,
    })
    if (!result.ok) {
      // 所有 tab 都是固定的，关闭失败（理论上不会发生）
      return
    }
    // 自动淘汰最早非固定标签时，给出明确提示
    if (result.evicted) {
      const now = Date.now()
      if (now - lastWarningAt > WARNING_DEBOUNCE_MS) {
        lastWarningAt = now
        ElMessage({
          type: 'warning',
          message: `标签已达上限 ${MAX_TABS} 个，已自动关闭最早打开的「${result.evicted.title}」，并打开当前「${title}」`,
          duration: 3500,
        })
      }
    }
    tabsStore.setActive(tabPath)
  }

  onMounted(() => {
    // 初始化：处理首次进入的路由
    handleRoute(router.currentRoute.value)
    // 之后每次切换都更新 tab
    const removeGuard = router.afterEach((to) => {
      handleRoute(to)
    })
    onBeforeUnmount(() => {
      removeGuard()
    })
  })
}
