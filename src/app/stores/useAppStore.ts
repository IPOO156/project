import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type TableDensity = 'comfortable' | 'compact'

const TABLE_DENSITY_KEY = 'table_density'

function readTableDensity(): TableDensity {
  if (typeof localStorage === 'undefined') return 'comfortable'
  return localStorage.getItem(TABLE_DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable'
}

/**
 * 全局应用级状态
 *  - 侧边栏折叠 / 移动端检测
 *  - 面包屑（可由 Layout 接管，此处保留为兜底数据源）
 *  - 全局页面级 loading（供 useTableQuery / useUpload 等切换）
 */
export const useAppStore = defineStore('app', () => {
  // state
  const sidebarCollapsed = ref(false)
  const isMobile = ref(false)
  const pageLoading = ref(false)
  const breadcrumbList = ref<{ label: string; path?: string }[]>([])
  /** 列表密度：只有两档，紧凑档只收紧表格行的上下内边距 */
  const tableDensity = ref<TableDensity>(readTableDensity())

  // getters
  const isSidebarCollapsed = computed(() => sidebarCollapsed.value)

  // actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setTableDensity(val: string | number | boolean | undefined) {
    const next: TableDensity = val === 'compact' ? 'compact' : 'comfortable'
    tableDensity.value = next
    try {
      localStorage.setItem(TABLE_DENSITY_KEY, next)
    } catch {
      /* 隐私模式下忽略持久化失败 */
    }
  }

  function setSidebarCollapsed(val: boolean) {
    sidebarCollapsed.value = val
  }

  function setBreadcrumb(list: { label: string; path?: string }[]) {
    breadcrumbList.value = list
  }

  function setPageLoading(val: boolean) {
    pageLoading.value = val
  }

  /**
   * 移动端断点检测（与 SCSS 媒体查询保持一致：<992 视为移动端）
   * 仅在浏览器环境执行，避免 SSR 报 window is not defined
   */
  function bindResponsive() {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(max-width: 991px)')
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      isMobile.value = e.matches
      if (e.matches) sidebarCollapsed.value = true
    }
    update(mql)
    mql.addEventListener('change', update)
  }

  /**
   * 立即绑定（store 第一次被使用即生效）。
   * 原先挂在 onMounted 上，但 store 是在模块作用域第一次 useAppStore() 时创建的，
   * 此时没有活跃组件实例，onMounted 直接被丢弃 → isMobile 永远 false，
   * 窄屏（<992px）侧栏不会收成抽屉，会把内容挤到只剩一半宽度。
   */
  bindResponsive()

  return {
    sidebarCollapsed,
    isMobile,
    pageLoading,
    breadcrumbList,
    tableDensity,
    isSidebarCollapsed,
    toggleSidebar,
    setTableDensity,
    setSidebarCollapsed,
    setBreadcrumb,
    setPageLoading,
    bindResponsive,
  }
})
