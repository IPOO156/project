<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import SidebarNav from '../components/layout/SidebarNav.vue'
import TopBar from '../components/layout/TopBar.vue'

const props = defineProps({
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div class="brandText">
          <div class="brandTitle">学校档案系统</div>
          <div class="brandSub">学生端</div>
        </div>
      </div>
      <div class="navWrap">
        <SidebarNav :groups="navGroups" :collapsed="sidebarCollapsed" />
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
  border-right: 1px solid var(--border);
  background: var(--panel);
  padding: 20px 12px;
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
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.brandMark {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  background: linear-gradient(135deg, var(--accent) 0%, #60a5fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.brandText {
  min-width: 0;
}

.brandTitle {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brandSub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
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
