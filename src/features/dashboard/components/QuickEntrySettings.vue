<script setup lang="ts">
import type { QuickEntry } from '../composables/useQuickEntries'
import { GripVertical, Plus, RotateCcw, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useQuickEntries } from '../composables/useQuickEntries'

const visible = defineModel<boolean>('visible', { default: false })

const { allEntries, updateOrder, toggleHidden, resetToDefault } = useQuickEntries()

const localList = ref<QuickEntry[]>([])
const dragIndex = ref<number>(-1)
const dragOverIndex = ref<number>(-1)

watch(
  () => allEntries.value,
  (entries) => {
    localList.value = entries.map((e) => ({ ...e }))
  },
  { immediate: true, deep: true },
)

const visibleList = computed(() => localList.value.filter((e) => !e.hidden))
const hiddenList = computed(() => localList.value.filter((e) => e.hidden))
const canAddMore = computed(() => visibleList.value.length < 6)

function handleDragStart(index: number) {
  dragIndex.value = index
}

function handleDragOver(index: number) {
  if (dragIndex.value === -1 || dragIndex.value === index) return
  dragOverIndex.value = index
}

function handleDrop(targetIndex: number) {
  if (dragIndex.value === -1 || dragIndex.value === targetIndex) return

  const list = [...visibleList.value]
  const [moved] = list.splice(dragIndex.value, 1)
  list.splice(targetIndex, 0, moved)

  const hidden = hiddenList.value
  localList.value = [...list, ...hidden]
  updateOrder(localList.value.map((e) => e.id))

  dragIndex.value = -1
  dragOverIndex.value = -1
}

function handleDragEnd() {
  dragIndex.value = -1
  dragOverIndex.value = -1
}

function handleToggleHidden(entry: QuickEntry) {
  toggleHidden(entry.id)
}

function handleReset() {
  resetToDefault()
}

function handleClose() {
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="自定义快捷入口"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="handleClose"
  >
    <div class="settings-desc">
      从下方「未添加入口」中选择页面添加到首页，或从「已添加入口」中删除。首页最多展示 6
      个入口，达到上限后需先删除再添加，拖拽可调整顺序。
    </div>

    <div class="entry-section">
      <div class="entry-section__title">已添加入口（{{ visibleList.length }}）</div>
      <div class="entry-list">
        <div
          v-for="(entry, index) in visibleList"
          :key="entry.id"
          class="entry-item"
          :class="{
            'is-dragging': dragIndex === index,
            'is-drag-over': dragOverIndex === index && dragIndex !== index,
          }"
          draggable="true"
          @dragstart="handleDragStart(index)"
          @dragover.prevent="handleDragOver(index)"
          @drop.prevent="handleDrop(index)"
          @dragend="handleDragEnd"
        >
          <GripVertical :size="16" class="entry-item__handle" />
          <div class="entry-item__icon" :style="{ background: entry.bgColor, color: entry.color }">
            <component :is="entry.icon" :size="18" />
          </div>
          <span class="entry-item__label">{{ entry.label }}</span>
          <el-tag v-if="entry.isRecent" size="small" type="primary" class="entry-item__tag">
            最近使用
          </el-tag>
          <el-button
            link
            type="danger"
            class="entry-item__action"
            :aria-label="`删除 ${entry.label}`"
            @click="handleToggleHidden(entry)"
          >
            <Trash2 :size="16" />
          </el-button>
        </div>
        <el-empty
          v-if="visibleList.length === 0"
          description="暂无已添加入口"
          :image-size="60"
          class="entry-empty"
        />
      </div>
    </div>

    <div v-if="hiddenList.length > 0" class="entry-section">
      <div class="entry-section__title">未添加入口（{{ hiddenList.length }}）</div>
      <div class="entry-list entry-list--hidden">
        <div v-for="entry in hiddenList" :key="entry.id" class="entry-item entry-item--hidden">
          <div class="entry-item__placeholder" />
          <div class="entry-item__icon" :style="{ background: entry.bgColor, color: entry.color }">
            <component :is="entry.icon" :size="18" />
          </div>
          <span class="entry-item__label">{{ entry.label }}</span>
          <el-button
            link
            type="primary"
            class="entry-item__action"
            :aria-label="`添加 ${entry.label}`"
            :disabled="!canAddMore"
            @click="handleToggleHidden(entry)"
          >
            <Plus :size="16" />
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button link :icon="RotateCcw" @click="handleReset"> 恢复默认 </el-button>
        <el-button type="primary" @click="handleClose"> 完成 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.settings-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &--hidden {
    opacity: 0.72;
  }
}

.entry-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: $radius-lg;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition:
    background-color 0.15s,
    transform 0.15s,
    box-shadow 0.15s;
  cursor: grab;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &--hidden {
    cursor: default;
    background: var(--el-fill-color);
    border-style: dashed;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }

  &.is-dragging {
    opacity: 0.5;
    transform: scale(0.98);
    cursor: grabbing;
  }

  &.is-drag-over {
    box-shadow: inset 0 0 0 2px var(--el-color-primary-light-7);
  }

  &__handle {
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  &__placeholder {
    width: 16px;
    flex-shrink: 0;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__tag {
    flex-shrink: 0;
  }

  &__action {
    flex-shrink: 0;
  }
}

.entry-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);

  &:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
  }
}

.entry-empty {
  padding: 16px 0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
</style>
