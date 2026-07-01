<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import LineIcon from '../ui/LineIcon.vue'
import UiTag from '../ui/UiTag.vue'
import { statusMeta, useArchiveStore } from '../../views/student/archiveStore'

defineEmits(['close'])

const router = useRouter()
const { sortedRecords } = useArchiveStore()

const notifications = computed(() => {
  const items = sortedRecords.value
  const list = []

  for (const item of items) {
    if (item.status === 'no') {
      list.push({
        id: `no-${item.id}`,
        type: 'danger',
        icon: 'close',
        title: '档案被驳回',
        desc: `${item.title} 已被驳回`,
        time: item.date,
        action: () => router.push(`/student/archive/${item.category}?view=${item.id}`),
      })
    } else if (item.status === 'wait') {
      list.push({
        id: `wait-${item.id}`,
        type: 'warning',
        icon: 'clock',
        title: '审核进行中',
        desc: `${item.title} 正在审核`,
        time: item.date,
        action: () => router.push(`/student/submissions`),
      })
    }
  }

  list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  return list.slice(0, 8)
})
</script>

<template>
  <div class="notifPanel" @click.stop>
    <div class="notifHead">
      <h3 class="notifTitle">消息通知</h3>
      <button class="closeBtn" type="button" aria-label="关闭" @click="$emit('close')">×</button>
    </div>
    <div class="notifList">
      <div v-for="n in notifications" :key="n.id" class="notifItem" @click="n.action(); $emit('close')">
        <span class="notifIcon" :data-type="n.type">
          <LineIcon :name="n.icon" :size="16" />
        </span>
        <div class="notifBody">
          <div class="notifMsg">
            <strong>{{ n.title }}</strong>
            <span>{{ n.desc }}</span>
          </div>
          <span class="notifTime">{{ n.time }}</span>
        </div>
      </div>
      <div v-if="notifications.length === 0" class="notifEmpty">
        <LineIcon name="bell" :size="24" />
        <p>暂无新通知</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifPanel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notifHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid var(--border);
}

.notifTitle {
  font-size: 16px;
  font-weight: 700;
}

.closeBtn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: transparent;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.closeBtn:hover {
  background: var(--bg);
}

.notifList {
  overflow-y: auto;
  flex: 1;
}

.notifItem {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
  transition: background var(--transition);
  border-bottom: 1px solid #f0f2f4;
}

.notifItem:hover {
  background: #f8fafb;
}

.notifItem:last-child {
  border-bottom: none;
}

.notifIcon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--accent-light);
  color: var(--accent);
}

.notifIcon[data-type='danger'] {
  background: var(--danger-light);
  color: var(--danger);
}

.notifIcon[data-type='warning'] {
  background: var(--warning-light);
  color: #b45309;
}

.notifBody {
  flex: 1;
  min-width: 0;
}

.notifMsg {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notifMsg strong {
  font-size: 13px;
  color: var(--text);
}

.notifMsg span {
  font-size: 12px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notifTime {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
  display: block;
}

.notifEmpty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--muted);
}

.notifEmpty p {
  font-size: 13px;
}
</style>
