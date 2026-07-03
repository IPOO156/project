<script setup lang="ts">
import type { TooltipState } from './HeroRings.types'

interface Props {
  tooltip: TooltipState
}

defineProps<Props>()
</script>

<template>
  <div
    class="hero-rings__tooltip"
    :class="{ 'is-visible': tooltip.visible }"
    :style="{
      // tooltip 位置跟随鼠标，需要动态 CSS 变量
      '--tooltip-x': `${tooltip.x}px`,
      '--tooltip-y': `${tooltip.y}px`,
    }"
  >
    <div class="hero-rings__tooltip-title">{{ tooltip.title }}</div>
    <div class="hero-rings__tooltip-meta">
      <span class="hero-rings__tooltip-date">{{ tooltip.date }}</span>
      <span class="hero-rings__tooltip-divider" aria-hidden="true">·</span>
      <span class="hero-rings__tooltip-semester">{{ tooltip.semester }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hero-rings__tooltip {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate3d(calc(var(--tooltip-x, 0)), calc(var(--tooltip-y, 0)), 0) translateX(-50%);
  pointer-events: none;
  z-index: 20;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  background: rgba(45, 30, 18, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.22),
    0 0 0 1px rgba(255, 252, 247, 0.1) inset;
  color: var(--bg-parchment, #f4efe6);
  max-width: 220px;
  text-align: left;
}

.hero-rings__tooltip::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(45, 30, 18, 0.92);
  pointer-events: none;
}

.hero-rings__tooltip.is-visible {
  opacity: 1;
  visibility: visible;
}

.hero-rings__tooltip-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff8e8;
  line-height: 1.35;
  margin-bottom: 0.2rem;
}

.hero-rings__tooltip-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: rgba(244, 239, 230, 0.72);
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.3px;
}

.hero-rings__tooltip-divider {
  opacity: 0.5;
}
</style>
