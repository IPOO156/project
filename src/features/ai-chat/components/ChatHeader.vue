<script setup lang="ts">
import type { ExportFormat } from '../types'
/**
 * ChatHeader - 主聊天区顶部栏
 *
 * 左：标题图标（在线绿点）+ 标题/副标题 + 在线状态徽章
 * 右：清空按钮 + 导出按钮（点击展开 ExportMenu 下拉）
 */
import { ChevronDown, Download, Sparkles, Trash2 } from 'lucide-vue-next'
import { ref } from 'vue'
import ExportMenu from './ExportMenu.vue'

defineProps<{
  online: boolean
  /** 消息条数（<=1 时禁用清空/导出） */
  messageCount: number
}>()

const emit = defineEmits<{
  clear: []
  export: [format: ExportFormat]
}>()

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
    <div class="ch__left">
      <div class="ch__icon">
        <Sparkles :size="20" />
        <span class="ch__online-dot" />
      </div>
      <div class="ch__titles">
        <h2 class="ch__title">
          档案智能助手
          <span class="ch__ver">V2.0</span>
        </h2>
        <p class="ch__subtitle">智能问答 · 档案申报 · 成长记录</p>
      </div>
      <span class="ch__badge">
        <span class="ch__badge-dot" />
        在线
      </span>
    </div>

    <div class="ch__right">
      <button class="ch__btn" :disabled="messageCount <= 1" title="清空对话" @click="emit('clear')">
        <Trash2 :size="15" />
        <span>清空</span>
      </button>

      <div class="ch__export">
        <button
          class="ch__btn ch__btn--accent"
          :disabled="messageCount <= 1"
          title="导出对话"
          @click="toggleExportMenu"
        >
          <Download :size="15" />
          <span>导出</span>
          <ChevronDown :size="13" class="ch__caret" :class="{ 'is-open': exportMenuVisible }" />
        </button>
        <ExportMenu
          :visible="exportMenuVisible"
          @select="handleExport"
          @close="exportMenuVisible = false"
        />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.ch {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-xl;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__icon {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: $radius-lg;
    background: linear-gradient(135deg, var(--mc-primary), var(--mc-primary-light));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__online-dot {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $color-success;
    border: 2px solid var(--el-bg-color);
  }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__title {
    margin: 0;
    font-size: $font-size-lg;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__ver {
    font-size: $font-size-xs;
    color: var(--mc-accent);
    background: color-mix(in srgb, var(--mc-accent) 12%, transparent);
    padding: 1px 6px;
    border-radius: $radius-sm;
    font-weight: 500;
  }

  &__subtitle {
    margin: 0;
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: 3px $spacing-sm;
    border-radius: $radius-2xl;
    background: rgba($color-success, 0.1);
    color: $color-success;
    font-size: $font-size-xs;
    font-weight: 500;
    margin-left: $spacing-sm;
  }

  &__badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $color-success;
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
    transition: all $duration-fast $ease-standard;

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

  &__export {
    position: relative;
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
    &__subtitle,
    &__badge {
      display: none;
    }

    &__btn span {
      display: none;
    }
  }
}
</style>
