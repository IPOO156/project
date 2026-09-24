<script setup lang="ts">
import type { QuickEntry } from '../composables/useQuickEntries'
import { ArrowRight, RefreshCw, Settings2, X } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  entries: QuickEntry[]
}>()

const emit = defineEmits<{
  (e: 'entryClick', entry: QuickEntry): void
  (e: 'refresh'): void
  (e: 'toggleHidden', id: string): void
  (e: 'updateOrder', orderedIds: string[]): void
  (e: 'openSettings'): void
}>()

const isRefreshing = ref(false)
const dragOverIndex = ref<number>(-1)
const dragActiveIndex = ref<number>(-1)

let dragStartIndex = -1

function handleRefresh() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  emit('refresh')
  setTimeout(() => {
    isRefreshing.value = false
  }, 600)
}

function handleKeydown(evt: KeyboardEvent, entry: QuickEntry) {
  if (evt.key === 'Enter' || evt.key === ' ') {
    evt.preventDefault()
    emit('entryClick', entry)
  }
}

function handleDragStartVisual(index: number) {
  dragActiveIndex.value = index
  dragStartIndex = index
}

function handleDragOver(index: number) {
  if (dragStartIndex === -1 || dragStartIndex === index) return
  dragOverIndex.value = index
}

function handleDropVisual(index: number) {
  dragActiveIndex.value = -1
  if (dragStartIndex === -1 || dragStartIndex === index) return

  const list = [...props.entries]
  const [moved] = list.splice(dragStartIndex, 1)
  list.splice(index, 0, moved)

  const orderedIds = list.map((e) => e.id)
  emit('updateOrder', orderedIds)

  dragStartIndex = -1
  dragOverIndex.value = -1
}

function handleDragEndVisual() {
  dragActiveIndex.value = -1
  dragStartIndex = -1
  dragOverIndex.value = -1
}
</script>

<template>
  <el-card class="quick-entries-card">
    <template #header>
      <div class="quick-entries-card__header">
        <span class="section-title">快捷入口</span>
        <div class="quick-entry-actions">
          <el-button
            text
            class="quick-entry-actions__refresh"
            aria-label="刷新快捷入口"
            @click="handleRefresh"
          >
            <RefreshCw :size="18" :class="{ 'is-spinning': isRefreshing }" />
          </el-button>
          <el-button
            text
            :icon="Settings2"
            aria-label="自定义快捷入口"
            @click="emit('openSettings')"
          />
        </div>
      </div>
    </template>
    <div class="quick-entry-grid" :class="`quick-entry-grid--${Math.min(entries.length, 6)}`">
      <div
        v-for="(entry, index) in entries"
        :key="entry.id"
        class="quick-entry"
        :class="{
          'is-drag-over': dragOverIndex === index,
          'is-dragging': dragActiveIndex === index,
        }"
        tabindex="0"
        role="button"
        draggable="true"
        @click="emit('entryClick', entry)"
        @keydown="(e) => handleKeydown(e, entry)"
        @dragstart="handleDragStartVisual(index)"
        @dragover.prevent="handleDragOver(index)"
        @drop.prevent="handleDropVisual(index)"
        @dragend="handleDragEndVisual"
      >
        <button
          type="button"
          class="quick-entry__remove"
          aria-label="删除快捷入口"
          @click.stop="emit('toggleHidden', entry.id)"
        >
          <X :size="12" />
        </button>
        <div class="quick-entry__body">
          <div class="quick-entry__icon" :style="{ background: entry.bgColor, color: entry.color }">
            <component :is="entry.icon" :size="20" />
          </div>
          <div class="quick-entry__info">
            <span class="quick-entry__label">{{ entry.label }}</span>
            <span v-if="entry.isRecent" class="quick-entry__badge">最近使用</span>
          </div>
          <ArrowRight :size="14" class="quick-entry__arrow" />
        </div>
      </div>
    </div>
    <el-empty
      v-if="entries.length === 0"
      description="暂无可见入口，请点击设置添加"
      :image-size="80"
    />
  </el-card>
</template>

<style scoped lang="scss">
.quick-entries-card {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  &--1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }

  &--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &--4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.quick-entry-actions {
  display: flex;
  align-items: center;
  gap: 4px;

  &__refresh {
    transition: transform 0.3s $ease-standard;

    &:hover {
      transform: rotate(180deg);
    }

    .is-spinning {
      animation: quick-refresh-spin 0.6s linear infinite;
    }
  }
}

@keyframes quick-refresh-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.quick-entry {
  cursor: pointer;
  border-radius: $radius-lg;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    border-color 0.2s;
  will-change: transform;
  position: relative;

  &.is-drag-over {
    box-shadow: inset 0 0 0 2px var(--el-color-primary-light-7);
  }

  &.is-dragging {
    opacity: 0.5;
    transform: scale(0.96);
    cursor: grabbing;
  }

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: var(--el-color-primary-light-7);
    outline: none;

    .quick-entry__icon {
      transform: scale(1.08);
    }

    .quick-entry__arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &:active {
    transform: translateY(0);
  }

  &__remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 20px;
    height: 20px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition:
      opacity 0.2s,
      background-color 0.2s,
      color 0.2s;
    z-index: 2;

    &:hover {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }

  &:hover &__remove,
  &:focus-visible &__remove {
    opacity: 1;
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__badge {
    font-size: 11px;
    line-height: 1;
    color: var(--el-color-primary);
  }

  &__arrow {
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.2s;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .quick-entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-entry {
    &__body {
      padding: 14px 12px;
      min-height: 44px;
    }

    &__arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

@media (max-width: 480px) {
  .quick-entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
