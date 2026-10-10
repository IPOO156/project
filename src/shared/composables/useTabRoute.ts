import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Tab 聚合页与 URL 的 query 同步（`?tab=xxx`）。
 *
 * 页面框架合并后，原本几个一级菜单被压成一个 hub，可达 URL 随之减少；
 * 不同步 query 就无法直达某个 tab（深链能力净损失），刷新也会回到第一个 tab。
 * 因此三个 hub 统一用 query 承载当前 tab。
 *
 * `availableKeys` 必须传**按权限过滤后**的 key 列表：带 `?tab=xxx` 进入但无该 tab
 * 权限时，会自动落回第一个可用 key，不会渲染出无权内容或空白页。
 *
 * 与路由 `meta.singleTab` 配套：query 变化不会裂出新的顶栏标签（见 useTabs）。
 *
 * @param availableKeys 当前用户可见的 tab key 列表（有序，取首项为兜底）
 * @param fallback 列表为空时的最终兜底 key（理论上 hub 本身已被守卫拦住）
 */
export function useTabRoute<T extends string>(
  availableKeys: ComputedRef<T[]>,
  fallback: T,
): { activeTab: ComputedRef<T> } {
  const route = useRoute()
  const router = useRouter()

  const activeTab = computed<T>({
    get() {
      const raw = route.query.tab
      const key = Array.isArray(raw) ? raw[0] : raw
      const keys = availableKeys.value
      if (key != null && (keys as string[]).includes(key)) return key as T
      return keys[0] ?? fallback
    },
    set(key: T) {
      // replace 而非 push：切 tab 不应在浏览器历史里堆一大串中间态
      void router.replace({ query: { ...route.query, tab: key } })
    },
  })

  return { activeTab }
}
