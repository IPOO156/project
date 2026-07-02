<script setup lang="ts">
/**
 * EmptyState - 通用空状态组件
 *
 * 用法：
 * <EmptyState text="暂无申报记录">
 *   <el-button type="primary" @click="handleAdd">立即新增</el-button>
 * </EmptyState>
 */
import { FileSearch } from 'lucide-vue-next'

interface Props {
  /** 文案 */
  text?: string
  /** 是否紧凑模式（用于卡片内） */
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  compact: false,
})
</script>

<template>
  <div class="empty-state" :class="{ 'empty-state--compact': compact }">
    <FileSearch :size="compact ? 40 : 56" class="empty-state__icon" />
    <p class="empty-state__text">{{ text }}</p>
    <div v-if="$slots.default" class="empty-state__action">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl;
  gap: $spacing-md;

  &--compact {
    padding: $spacing-xl;
  }

  &__icon {
    color: var(--el-text-color-placeholder);
    opacity: 0.6;
  }

  &__text {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: $font-size-base;
  }

  &__action {
    margin-top: $spacing-sm;
  }
}
</style>
