<script setup lang="ts">
import { useLoadingTip } from '@/shared/composables/useLoadingTip'

/**
 * 内联学习建议：用于空状态（el-empty 默认插槽 / EmptyState）。
 * 与加载页共用同一提示库，按路由、角色与年级匹配。
 */
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { tip, refresh } = useLoadingTip()
</script>

<template>
  <div class="study-tip-inline" :class="{ 'study-tip-inline--compact': compact }" aria-live="off">
    <span class="study-tip-inline__label">小建议</span>
    <p class="study-tip-inline__text">{{ tip.text }}</p>
    <button class="study-tip-inline__next" type="button" @click="refresh">换一条</button>
  </div>
</template>

<style scoped lang="scss">
.study-tip-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: min(520px, 100%);
  margin: $spacing-sm auto 0;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-base;
  background: var(--el-fill-color-lighter);
  line-height: 1.6;

  &--compact {
    margin-top: $spacing-xs;
    padding: 0;
    background: transparent;
  }

  &__label {
    color: var(--el-text-color-secondary);
    font-size: $font-size-xs;
    letter-spacing: 0.1em;
  }

  &__text {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: $font-size-sm;
    text-align: center;
  }

  &--compact &__text {
    font-size: $font-size-xs;
  }

  &__next {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--el-color-primary);
    font-size: $font-size-xs;
    cursor: pointer;
  }
}
</style>
