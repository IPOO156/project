<script setup>
import UiButton from '../ui/UiButton.vue'

const props = defineProps({
  collapsed: { type: Boolean, required: true },
  section: { type: String, default: '' },
  title: { type: String, default: '' },
})

const emit = defineEmits(['toggle-sidebar'])
</script>

<template>
  <header class="topbar">
    <div class="left">
      <button class="iconBtn" type="button" :aria-label="collapsed ? '展开侧栏' : '收起侧栏'" @click="emit('toggle-sidebar')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line v-if="!collapsed" x1="3" y1="6" x2="21" y2="6"/>
          <line v-if="!collapsed" x1="3" y1="12" x2="21" y2="12"/>
          <line v-if="!collapsed" x1="3" y1="18" x2="21" y2="18"/>
          <line v-if="collapsed" x1="4" y1="6" x2="20" y2="6"/>
          <line v-if="collapsed" x1="4" y1="12" x2="14" y2="12"/>
          <line v-if="collapsed" x1="4" y1="18" x2="20" y2="18"/>
        </svg>
      </button>
      <div class="crumb">
        <div class="small">{{ section }}</div>
        <div class="big">{{ title }}</div>
      </div>
    </div>

    <div class="right">
      <UiButton variant="secondary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        导出
      </UiButton>
      <UiButton variant="primary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        新增档案
      </UiButton>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.iconBtn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.iconBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.crumb {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.small {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}

.big {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
