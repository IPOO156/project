<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import UiButton from '../ui/UiButton.vue'
import LineIcon from '../ui/LineIcon.vue'
import NotificationPanel from './NotificationPanel.vue'
import { exportRecords, useArchiveStore } from '../../views/student/archiveStore'

const props = defineProps({
  collapsed: { type: Boolean, required: true },
  section: { type: String, default: '' },
  title: { type: String, default: '' },
})

const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const { records } = useArchiveStore()
const showNotifications = ref(false)

function exportAll() {
  exportRecords(records.value, '全部成长档案.csv')
}

function createArchive() {
  router.push('/student/archive/honor?new=1')
}
</script>

<template>
  <header class="topbar">
    <div class="left">
      <button
        class="iconBtn"
        type="button"
        :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
        @click="emit('toggle-sidebar')"
      >
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
      <UiButton variant="secondary" @click="exportAll">
        <LineIcon name="download" :size="15" />
        导出
      </UiButton>
      <UiButton variant="primary" @click="createArchive">
        <LineIcon name="plus" :size="15" :stroke-width="2.5" />
        新增档案
      </UiButton>

      <div class="notifWrap">
        <button
          class="notifBtn"
          type="button"
          aria-label="通知"
          @click="showNotifications = !showNotifications"
        >
          <LineIcon name="bell" :size="18" />
          <span class="notifDot"></span>
        </button>
        <NotificationPanel v-if="showNotifications" @close="showNotifications = false" />
      </div>
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
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notifWrap {
  position: relative;
}

.notifBtn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
  position: relative;
}

.notifBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

.notifDot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 7px;
  height: 7px;
  background: var(--danger);
  border-radius: 50%;
  border: 2px solid var(--panel);
}
</style>
