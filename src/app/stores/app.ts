import { defineStore } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 多标签页 Tab 项
 */
export interface TabItem {
  path: string
  title: string
  closable: boolean
}

/**
 * 全局应用级状态
 *  - 侧边栏折叠 / 移动端检测
 *  - 面包屑（可由 Layout 接管，此处保留为兜底数据源）
 *  - 全局页面级 loading（供 useTableQuery / useUpload 等切换）
 *  - 多标签页管理（点击侧边栏在内容区上方生成标签卡）
 */
export const useAppStore = defineStore('app', () => {
  // state
  const sidebarCollapsed = ref(false)
  const isMobile = ref(false)
  const pageLoading = ref(false)
  const breadcrumbList = ref<{ label: string, path?: string }[]>([])

  // 多标签页状态
  const tabs = ref<TabItem[]>([])
  const activeTabPath = ref('')

  // getters
  const isSidebarCollapsed = computed(() => sidebarCollapsed.value)
  /** 当前标签页索引 */
  const activeTabIndex = computed(() => tabs.value.findIndex(t => t.path === activeTabPath.value))

  // actions

  /**
   * 添加（或切换到）一个标签页
   * 如果路径已存在则只切换不重复添加
   */
  function addTab(path: string, title: string, closable = true) {
    const exists = tabs.value.find(t => t.path === path)
    if (exists) {
      activeTabPath.value = path
      return
    }
    tabs.value.push({ path, title, closable })
    activeTabPath.value = path
  }

  /**
   * 关闭标签页，自动切换到相邻标签
   */
  function closeTab(path: string) {
    const idx = tabs.value.findIndex(t => t.path === path)
    if (idx === -1) return
    tabs.value.splice(idx, 1)
    // 切换：优先右边，其次左边
    if (activeTabPath.value === path) {
      const next = tabs.value[idx] ?? tabs.value[idx - 1]
      activeTabPath.value = next?.path ?? ''
    }
  }

  /** 关闭除当前标签外的所有标签 */
  function closeOtherTabs(path: string) {
    tabs.value = tabs.value.filter(t => t.path === path || !t.closable)
  }

  /** 关闭所有可关闭的标签 */
  function closeAllTabs() {
    tabs.value = tabs.value.filter(t => !t.closable)
    activeTabPath.value = tabs.value[0]?.path ?? ''
  }
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(val: boolean) {
    sidebarCollapsed.value = val
  }

  function setBreadcrumb(list: { label: string, path?: string }[]) {
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
    if (typeof window === 'undefined')
      return
    const mql = window.matchMedia('(max-width: 991px)')
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      isMobile.value = e.matches
      if (e.matches)
        sidebarCollapsed.value = true
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
    tabs,
    activeTabPath,
    isSidebarCollapsed,
    activeTabIndex,
    toggleSidebar,
    setSidebarCollapsed,
    setBreadcrumb,
    setPageLoading,
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    bindResponsive,
  }
})
