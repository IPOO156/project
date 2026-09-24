import { defineStore } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

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

  // getters
  const isSidebarCollapsed = computed(() => sidebarCollapsed.value)

  // actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
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
    onBeforeUnmount(() => mql.removeEventListener('change', update))
  }

  // 立即绑定（store 第一次被使用即生效）
  onMounted(bindResponsive)

  return {
    sidebarCollapsed,
    isMobile,
    pageLoading,
    breadcrumbList,
    isSidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    setBreadcrumb,
    setPageLoading,
    bindResponsive,
  }
})
