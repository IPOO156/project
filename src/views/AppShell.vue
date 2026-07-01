<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import SidebarNav from '../components/layout/SidebarNav.vue'
import TopBar from '../components/layout/TopBar.vue'
import LineIcon from '../components/ui/LineIcon.vue'
import NotificationPanel from '../components/layout/NotificationPanel.vue'

defineProps({
  navGroups: {
    type: Array,
    required: true,
  },
})

const route = useRoute()

const storageKey = 'sa.sidebarCollapsed'
const sidebarCollapsed = ref(localStorage.getItem(storageKey) === '1')

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem(storageKey, sidebarCollapsed.value ? '1' : '0')
}

const title = computed(() => route.meta?.title ?? '')
const section = computed(() => route.meta?.section ?? '')
</script>

<template>
  <div class="appShell" :data-collapsed="sidebarCollapsed ? '1' : '0'">
    <aside class="sidebar">
      <div class="brand">
        <div class="brandMark">
          <LineIcon name="book" :size="20" />
        </div>
        <div class="brandText">
          <div class="brandTitle">档案管理系统</div>
          <div class="brandSub">学生端</div>
        </div>
      </div>
      <div class="navWrap">
        <SidebarNav :groups="navGroups" :collapsed="sidebarCollapsed" />
      </div>
      <div class="sidebarFooter">
        <span class="version">v1.0.0</span>
      </div>
    </aside>

    <main class="main">
      <TopBar
        :collapsed="sidebarCollapsed"
        :section="section"
        :title="title"
        @toggle-sidebar="toggleSidebar"
      />
      <div class="page">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.appShell {
  min-height: 100svh;
  display: grid;
  grid-template-columns: 260px 1fr;
  width: 100%;
}

.appShell[data-collapsed='1'] {
  grid-template-columns: 72px 1fr;
}

.sidebar {
  background: var(--sidebar-bg);
  border-right: 1px solid rgba(255,255,255,0.06);
  padding: 18px 12px;
  overflow: hidden;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 20px;
  border-bottom: 1px solid var(--sidebar-divider);
  margin-bottom: 16px;
}

.brandMark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--sidebar-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.brandText {
  min-width: 0;
}

.brandTitle {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0;
  color: #e8edf0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brandSub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--sidebar-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.appShell[data-collapsed='1'] .brandText {
  display: none;
}

.appShell[data-collapsed='1'] .brand {
  justify-content: center;
  padding: 8px 0 20px;
}

.navWrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  padding-bottom: 20px;
}

.navWrap::-webkit-scrollbar {
  width: 4px;
}

.navWrap::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}

.sidebarFooter {
  padding: 12px 12px 0;
  border-top: 1px solid var(--sidebar-divider);
  margin-top: auto;
}

.version {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

.page {
  padding: 24px 28px;
  flex: 1;
  background: var(--bg);
}

@media (max-width: 980px) {
  .appShell {
    grid-template-columns: 1fr;
  }
  .sidebar {
    display: none;
  }
}
</style>
