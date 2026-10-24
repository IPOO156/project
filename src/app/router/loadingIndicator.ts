import type { Router } from 'vue-router'
import { useAppStore } from '@/app/stores/useAppStore'

/**
 * 慢导航加载页触发
 *
 * 设计取舍：
 *  - 只在路由切换超过 400ms 时才显示全屏加载页：短导航不打扰；
 *  - 一旦显示，至少保留 1.2s，让用户能读完一条温馨提示再淡出；
 *  - 页面内部的数据请求仍由各页面自己的 v-loading 表达，不复用这套全局遮罩；
 *  - 首屏导航（from 无 name）不触发：此时布局尚未挂载，加载页无处渲染；
 *  - Login 等 noLayout 路由不触发。
 */

const SHOW_DELAY_MS = 400
const MIN_VISIBLE_MS = 1200

let showTimer: number | null = null
let hideTimer: number | null = null
let shownAt = 0
/** 每次导航递增，用于作废上一次导航遗留的计时器回调 */
let generation = 0

function clearShowTimer(): void {
  if (showTimer !== null) {
    window.clearTimeout(showTimer)
    showTimer = null
  }
}

function clearHideTimer(): void {
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

export function setupNavigationLoading(router: Router): void {
  router.beforeEach((to, from, next) => {
    if (!from.name || to.meta?.noLayout) {
      next()
      return
    }

    generation += 1
    const current = generation
    clearShowTimer()
    clearHideTimer()

    showTimer = window.setTimeout(() => {
      showTimer = null
      if (current !== generation) return
      shownAt = Date.now()
      useAppStore().setPageLoading(true)
    }, SHOW_DELAY_MS)

    next()
  })

  router.afterEach((_to, _from, failure) => {
    // 重定向/取消也会进 afterEach，此时不能收尾，交由下一次导航处理
    if (failure) return

    generation += 1
    clearShowTimer()

    const appStore = useAppStore()
    if (!appStore.pageLoading) return

    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt))
    clearHideTimer()
    hideTimer = window.setTimeout(() => {
      hideTimer = null
      appStore.setPageLoading(false)
    }, remaining)
  })

  router.onError(() => {
    generation += 1
    clearShowTimer()
    clearHideTimer()
    useAppStore().setPageLoading(false)
  })
}
