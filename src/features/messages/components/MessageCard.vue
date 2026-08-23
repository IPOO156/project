<script setup lang="ts">
import type { Notification, NotificationCategory } from '@/shared/types/types'
import { Archive, Bell, Bot, Mail, MailOpen, MessageSquare } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/app/stores/stores'
import { NOTIFICATION_CATEGORY } from '@/shared/constants/dict'

interface Props {
  item: Notification
  batchMode: boolean
  checked: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  read: [id: string]
  archive: [id: string]
  toggleSelect: [id: string]
}>()

const router = useRouter()
const themeStore = useThemeStore()

function categoryLabel(category: NotificationCategory) {
  return props.item.categoryLabel || NOTIFICATION_CATEGORY[category]?.label || category
}

function categoryStyle(category: NotificationCategory) {
  const lightMap: Record<NotificationCategory, { backgroundColor: string; color: string }> = {
    audit_remind: { backgroundColor: 'rgba(255, 167, 38, 0.14)', color: '#f57c00' },
    dynamic_remind: { backgroundColor: 'rgba(67, 160, 71, 0.12)', color: '#388e3c' },
    private_message: { backgroundColor: 'rgba(30, 136, 229, 0.10)', color: '#1e88e5' },
    system_notice: { backgroundColor: 'rgba(96, 125, 139, 0.12)', color: '#546e7a' },
  }
  const darkMap: Record<NotificationCategory, { backgroundColor: string; color: string }> = {
    audit_remind: { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' },
    dynamic_remind: { backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80' },
    private_message: { backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#93c5fd' },
    system_notice: { backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' },
  }
  const map = themeStore.isDark ? darkMap : lightMap
  return map[category] ?? lightMap.system_notice
}

function getCategoryIcon(category: NotificationCategory) {
  const icons: Record<NotificationCategory, any> = {
    audit_remind: Mail,
    dynamic_remind: Bot,
    private_message: MessageSquare,
    system_notice: Bell,
  }
  return icons[category] ?? Mail
}

function handleCardClick() {
  if (props.batchMode) return
  if (props.item.isRead !== 1) emit('read', props.item.id)
  if (props.item.jumpUrl) router.push(props.item.jumpUrl)
}
</script>

<template>
  <div
    class="message-card"
    :class="{
      'is-unread': item.isRead !== 1,
      'is-archived': item.isArchived === 1,
      'is-clickable': !!item.jumpUrl && !batchMode,
    }"
    @click="handleCardClick"
  >
    <label v-if="batchMode" class="message-card__checkbox" @click.stop>
      <input type="checkbox" :checked="checked" @change="emit('toggleSelect', item.id)" />
    </label>
    <div class="message-card__accent" />
    <div class="message-card__icon" :style="categoryStyle(item.category)">
      <component :is="getCategoryIcon(item.category)" :size="20" />
    </div>

    <div class="message-card__main">
      <div class="message-card__header-row">
        <span class="message-card__category">{{ categoryLabel(item.category) }}</span>
        <h3 class="message-card__title">
          {{ item.title }}
          <el-tag v-if="item.isArchived === 1" size="small" type="info" effect="plain"
            >已归档</el-tag
          >
        </h3>
      </div>
      <p class="message-card__content">{{ item.content }}</p>

      <div class="message-card__meta">
        <span class="message-card__time">
          <MailOpen v-if="item.isRead === 1" :size="12" />
          <Mail v-else :size="12" />
          {{ item.createdAt }}
        </span>
        <span v-if="item.deadline" class="message-card__extra">
          截止处理：{{ item.deadline }}
        </span>
        <span v-if="item.senderName" class="message-card__sender">来自：{{ item.senderName }}</span>
      </div>

      <div v-if="item.jumpUrl && item.isArchived !== 1" class="message-card__link-hint">
        点击查看详情 →
      </div>
    </div>

    <div class="message-card__actions">
      <el-tooltip v-if="item.isRead !== 1" content="标为已读" placement="top">
        <button
          type="button"
          class="action-icon action-icon--read"
          @click.stop="emit('read', item.id)"
        >
          <MailOpen :size="16" />
        </button>
      </el-tooltip>
      <el-tooltip
        v-if="item.isImportant !== 1 && item.isArchived !== 1"
        content="归档"
        placement="top"
      >
        <button
          type="button"
          class="action-icon action-icon--archive"
          @click.stop="emit('archive', item.id)"
        >
          <Archive :size="16" />
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/features/messages/styles/theme' as *;

.message-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--mc-card);
  border: 1px solid var(--mc-border);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    border-color: #d4a574;
  }

  &.is-unread {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
    .message-card__title {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  &.is-archived {
    opacity: 0.7;
  }
  &.is-clickable {
    cursor: pointer;
  }

  &__icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }
  &__main {
    flex: 1;
    min-width: 0;
  }
  &__header-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }
  &__category {
    flex-shrink: 0;
    padding: 1px 7px;
    border-radius: 4px;
    background: var(--mc-bg);
    color: var(--mc-text-secondary);
    font-size: 11px;
    font-weight: 500;
  }
  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--mc-text);
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  &__content {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--mc-text-secondary);
    line-height: 1.5;
  }
  &__checkbox {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 2px;
    input[type='checkbox'] {
      width: 16px;
      height: 16px;
      accent-color: var(--el-color-primary);
      cursor: pointer;
    }
  }
  &__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    color: var(--mc-text-secondary);
  }
  &__time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  &__extra {
    padding-left: 8px;
    border-left: 1px solid var(--mc-border);
    color: var(--el-color-warning);
  }
  &__sender {
    padding-left: 8px;
    border-left: 1px solid var(--mc-border);
  }
  &__link-hint {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-color-primary);
    font-weight: 500;
  }
  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--mc-text-secondary);
  background: transparent;
  &:hover {
    background: var(--mc-bg);
  }
  &--read {
    color: var(--mc-sage);
    &:hover {
      background: var(--mc-sage-fade);
      color: var(--mc-sage);
    }
  }
  &--archive {
    color: var(--mc-wood);
    &:hover {
      background: var(--mc-wood-fade);
      color: var(--mc-wood);
    }
  }
}

@media (max-width: 768px) {
  .message-card {
    flex-direction: column;
    &__actions {
      width: 100%;
      justify-content: flex-end;
      padding-top: 10px;
      border-top: 1px solid var(--mc-border);
    }
  }
}
</style>
