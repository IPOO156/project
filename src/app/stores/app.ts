import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // state
  const sidebarCollapsed = ref(false)
  const breadcrumbList = ref<{ label: string, path?: string }[]>([])

  // getters
  const isSidebarCollapsed = computed(() => sidebarCollapsed.value)

  // actions
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(val: boolean) {
    sidebarCollapsed.value = val
  }

  function setBreadcrumb(list: { label: string, path?: string }[]) {
    breadcrumbList.value = list
  }

  return { sidebarCollapsed, breadcrumbList, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, setBreadcrumb }
})
