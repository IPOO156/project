<script setup lang="ts">
/**
 * AI 思考指示器：三点依次跳动。
 * 由 MessageBubble（流式占位气泡）与 AIChatDrawer（悬浮窗）共用，
 * 保证两处思考动画节奏一致。
 */
</script>

<template>
  <span class="thinking-dots" role="status" aria-label="AI 正在思考">
    <span class="thinking-dots__dot" />
    <span class="thinking-dots__dot" />
    <span class="thinking-dots__dot" />
  </span>
</template>

<style scoped lang="scss">
.thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--mc-primary);
    animation: thinkingDot 1.2s $ease-standard infinite;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}

/* 依次抬起 → 回落，形成「输入中」的波浪节奏 */
@keyframes thinkingDot {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
