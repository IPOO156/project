<script setup lang="ts">
import type { ExportFormat } from '../ai-chat.types'
/**
 * ChatHeader - 主聊天区顶部栏
 *
 * 品牌只在左侧历史栏出现一次；这里展示当前会话标题 + 在线状态，
 * 右侧为清空 / 导出（导出下拉由 ExportMenu 承载）。
 */
import { ChevronDown, Download, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import ExportMenu from './ExportMenu.vue'

const props = defineProps<{
  /** 当前会话标题（无会话时为「新的对话」） */
  title: string
  /** AI 服务是否可用（离线回退时为 false） */
  online: boolean
  /** 消息条数（<=1 时禁用清空/导出） */
  messageCount: number
}>()

const emit = defineEmits<{
  clear: []
  export: [format: ExportFormat]
}>()
/** 状态徽章文案与说明：离线时如实展示，不再固定“在线” */
const statusText = computed(() => (props.online ? '在线' : '离线'))
const statusHint = computed(() =>
  props.online ? 'AI 服务可用' : '后端服务不可用，当前为离线模拟回复',
)

const exportMenuVisible = ref(false)

function toggleExportMenu() {
  exportMenuVisible.value = !exportMenuVisible.value
}

function handleExport(format: ExportFormat) {
  emit('export', format)
}
</script>

<template>
  <header class="ch">
    <div class="ch__inner">
      <div class="ch__left">
        <h2 class="ch__title" :title="title">{{ title }}</h2>
        <span class="ch__badge" :class="{ 'is-offline': !online }" :title="statusHint">
          <span class="ch__badge-dot" :class="{ 'is-offline': !online }" />
          {{ statusText }}
        </span>
      </div>

      <div class="ch__right">
        <button
          class="ch__btn"
          :disabled="messageCount <= 1"
          title="清空对话"
          @click="emit('clear')"
        >
          <Trash2 :size="16" />
          <span>清空</span>
        </button>

        <ExportMenu
          :visible="exportMenuVisible"
          @select="handleExport"
          @close="exportMenuVisible = false"
        >
          <button
            class="ch__btn ch__btn--accent"
            :disabled="messageCount <= 1"
            title="导出对话"
            @click="toggleExportMenu"
          >
            <Download :size="16" />
            <span>导出</span>
            <ChevronDown :size="16" class="ch__caret" :class="{ 'is-open': exportMenuVisible }" />
          </button>
        </ExportMenu>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.ch {
  flex-shrink: 0;
  padding: $spacing-md $spacing-xl;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  // 铺满主区，与消息列共用同一左边界
  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    width: 100%;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: 4px $spacing-sm;
    border-radius: $radius-2xl;
    background: rgba($color-success, 0.1);
    color: $color-success-text;
    font-size: $font-size-xs;
    font-weight: 500;
    flex-shrink: 0;

    &.is-offline {
      background: rgba($color-warning, 0.12);
      color: $color-warning;
    }
  }

  &__badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $color-success;

    &.is-offline {
      background: $color-warning;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-md;
    border: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    border-radius: $radius-base;
    font-size: $font-size-sm;
    color: var(--el-text-color-regular);
    cursor: pointer;
    @include transition-ui;

    &:hover:not(:disabled) {
      border-color: var(--mc-primary);
      color: var(--mc-primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--accent:hover:not(:disabled) {
      border-color: var(--mc-accent);
      color: var(--mc-accent);
    }
  }

  &__caret {
    transition: transform $duration-fast $ease-standard;

    &.is-open {
      transform: rotate(180deg);
    }
  }
}

@media (max-width: 768px) {
  .ch {
    padding: $spacing-md;

    &__btn span {
      display: none;
    }
  }
}
</style>
