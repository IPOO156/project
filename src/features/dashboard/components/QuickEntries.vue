<script setup lang="ts">
import type { QuickEntry } from '../composables/useQuickEntries'
import { ArrowRight, RefreshCw, Settings2, X } from 'lucide-vue-next'
import { ref } from 'vue'

const props = defineProps<{
  entries: QuickEntry[]
  /** 候选池总数（真实菜单入口数），用于头部 N / 总数 与库位点阵 */
  totalCount: number
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
  <section class="quick-card" aria-label="快捷入口">
    <header class="quick-card__head">
      <h2 class="quick-card__title">快捷入口</h2>
      <span class="quick-card__count">{{ entries.length }} / {{ totalCount }}</span>
      <div class="quick-card__tools">
        <button
          type="button"
          class="icon-btn icon-btn--refresh"
          aria-label="刷新快捷入口"
          @click="handleRefresh"
        >
          <RefreshCw :size="15" :class="{ 'is-spinning': isRefreshing }" />
        </button>
        <button
          type="button"
          class="icon-btn"
          aria-label="自定义快捷入口"
          @click="emit('openSettings')"
        >
          <Settings2 :size="15" />
        </button>
      </div>
    </header>

    <div class="quick-card__body">
      <div v-if="entries.length" class="quick-grid">
        <div
          v-for="(entry, index) in entries"
          :key="entry.id"
          class="qitem"
          :class="{
            'is-drag-over': dragOverIndex === index,
            'is-dragging': dragActiveIndex === index,
          }"
          :style="{ '--entry-index': index }"
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
          <span
            class="qitem__icon"
            :style="{ background: entry.bgColor, color: entry.color }"
            aria-hidden="true"
          >
            <component :is="entry.icon" :size="20" />
          </span>
          <span class="qitem__info">
            <span class="qitem__label">{{ entry.label }}</span>
            <span v-if="entry.isRecent" class="qitem__badge">最近使用</span>
          </span>
          <ArrowRight :size="14" class="qitem__arrow" />
          <button
            type="button"
            class="qitem__remove"
            aria-label="删除快捷入口"
            @click.stop="emit('toggleHidden', entry.id)"
          >
            <X :size="12" />
          </button>
        </div>
      </div>

      <div v-else class="quick-grid">
        <div v-for="n in 6" :key="n" class="qitem qitem--slot" aria-hidden="true">
          <span class="qitem__icon qitem__icon--slot" />
          <span class="qitem__label">虚位待添加</span>
        </div>
      </div>
    </div>

    <footer class="quick-card__foot">
      <span v-if="entries.length" class="quick-card__hint">
        {{ entries.length }} / {{ totalCount }} · 拖拽可排序 · 悬停出现移除按钮
      </span>
      <span v-else class="quick-card__hint">暂无可见入口，请点击设置添加</span>
      <span class="qdots" aria-hidden="true">
        <i v-for="n in totalCount" :key="n" :class="{ off: n > entries.length }" />
      </span>
    </footer>
  </section>
</template>

<style scoped lang="scss">
.quick-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.quick-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.quick-card__title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.quick-card__count {
  font-size: $font-size-xs;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.quick-card__tools {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.icon-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    background-color $duration-fast $ease-standard,
    color $duration-fast $ease-standard;

  &:hover,
  &:focus-visible {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    outline: none;
  }

  .is-spinning {
    animation: quick-refresh-spin 0.6s linear infinite;
  }
}

// 刷新按钮 hover 旋转 180°（与 HEAD 的 .quick-entry-actions__refresh 一致：280ms 标准曲线）
.icon-btn--refresh {
  transition:
    transform $duration-slow $ease-standard,
    background-color $duration-fast $ease-standard,
    color $duration-fast $ease-standard;

  &:hover {
    transform: rotate(180deg);
  }
}

@keyframes quick-entry-in {
  from {
    opacity: 0;
    transform: translateY(4px);
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

.quick-card__body {
  flex: 1;
  min-height: 0;
  padding: 10px 12px 0;
}

.quick-grid {
  display: grid;
  height: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  // 行高按容器剩余高度均分，让入口随卡片一起长高而不是挤在顶部
  grid-auto-rows: minmax(0, 1fr);
  gap: 8px;
}

.qitem {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $radius-lg;
  background: var(--el-bg-color);
  cursor: pointer;
  transition:
    transform $duration-base $ease-standard,
    box-shadow $duration-base $ease-standard,
    border-color $duration-base $ease-standard;
  // 首次渲染按索引错峰入场（40ms/个）
  animation: quick-entry-in $duration-slow $ease-decelerate backwards;
  animation-delay: calc(var(--entry-index, 0) * 40ms);

  &.is-drag-over {
    box-shadow: inset 0 0 0 2px var(--el-color-primary-light-7);
  }

  &.is-dragging {
    opacity: 0.5;
    transform: scale(0.96);
    cursor: grabbing;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      border-color: var(--el-color-primary-light-7);

      .qitem__icon {
        transform: scale(1.08);
      }

      .qitem__arrow {
        opacity: 1;
        transform: translateX(0);
      }
    }
  }

  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    border-color: var(--el-color-primary-light-7);
    outline: none;

    .qitem__icon {
      transform: scale(1.08);
    }

    .qitem__arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
    transition-duration: $duration-instant;
  }

  &--slot {
    cursor: default;
    border-style: dashed;
    background: transparent;
    color: var(--el-text-color-placeholder);
    animation: none;
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

    &--slot {
      border: 1px dashed var(--el-border-color);
      background: transparent;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: $font-size-base;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &--slot &__label {
    color: var(--el-text-color-placeholder);
    font-weight: 400;
  }

  &__badge {
    font-size: 11px;
    line-height: 1.2;
    color: var(--el-color-primary);
  }

  &__arrow {
    opacity: 0;
    transform: translateX(-4px);
    transition:
      opacity $duration-base $ease-standard,
      transform $duration-base $ease-standard;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }

  &__remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    padding: 0;
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
      opacity $duration-base $ease-standard,
      background-color $duration-base $ease-standard,
      color $duration-base $ease-standard;
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

  // 触屏没有 hover，删除入口必须常驻，否则入口无法移除
  @media (hover: none) {
    &__remove {
      opacity: 1;
    }
  }
}

.quick-card__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  padding: 4px 16px 8px;
  font-size: $font-size-xs;
  color: var(--el-text-color-placeholder);
}

.quick-card__hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qdots {
  display: flex;
  gap: 3px;
  margin-left: auto;
  flex-shrink: 0;

  i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--el-color-primary);

    &.off {
      background: var(--el-border-color);
    }
  }
}

@media (max-width: 768px) {
  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .qitem__arrow {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
