<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <p class="loading-tip">
    <svg class="loading-tip__icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.2v4.1" />
      <circle cx="8" cy="4.8" r="0.65" fill="currentColor" stroke="none" />
    </svg>
    <span class="loading-tip__text">{{ text }}</span>
  </p>
</template>

<style scoped lang="scss">
/* 加载页温馨提示：单行、细线图标，不占卡片层级，避免和遮罩抢注意力 */
.loading-tip {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  max-width: min(440px, calc(100vw - 48px));
  // 与主文案留 24px（$spacing-xl），落在 8px 网格上
  margin: $spacing-xl 0 0;
  color: var(--el-text-color-secondary);
  font-size: $font-size-base;
  line-height: 1.5;
  text-align: left;
  animation: loading-tip-in 220ms $ease-decelerate both;
  animation-delay: 80ms;
}

.loading-tip__icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  // 图标与文字基线对齐：14px 字 × 1.5 行高 = 21px，图标顶部偏移 3.5px
  margin-top: 3.5px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  stroke-linecap: round;
  color: var(--el-color-primary);
  opacity: 0.6;
}

.loading-tip__text {
  min-width: 0;
}

/* 只动 opacity + transform（合成层） */
@keyframes loading-tip-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
