import type { RouteLocationMatched, RouteLocationNormalized } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTabsStore } from '@/app/stores/tabs'

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
    tabsStore.addTab({
      path: to.fullPath,
      title,
      closable: !affix,
      affix,
    })
    tabsStore.setActive(to.fullPath)
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
