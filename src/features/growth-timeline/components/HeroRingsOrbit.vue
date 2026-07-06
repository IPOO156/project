<script setup lang="ts">
import type { RingItem } from './HeroRings.types'

interface Props {
  rings: RingItem[]
  extinguishedRings: Set<number>
  scrollY: number
  center?: number
}

const props = withDefaults(defineProps<Props>(), {
  center: 200,
})

const CENTER = props.center

function parallaxScale(index: number) {
  return Math.min(1 + props.scrollY * 0.0004 * (index + 1), 1.3).toFixed(3)
}

function parallaxOpacity() {
  return Math.max(0, 0.5 - props.scrollY * 0.001).toFixed(3)
}
</script>

<template>
  <svg class="hero-rings__svg" :viewBox="`0 0 ${CENTER * 2} ${CENTER * 2}`">
    <g
      v-for="(ring, index) in rings"
      :key="ring.r"
      class="hero-rings__ring-wrap"
      :style="{
        // 每圈的视差缩放/透明度随滚动动态变化
        transform: `scale(${parallaxScale(index)})`,
        opacity: parallaxOpacity(),
      }"
    >
      <circle
        class="hero-rings__ring"
        :class="{ 'is-extinguished': extinguishedRings.has(index) }"
        :cx="CENTER"
        :cy="CENTER"
        :r="ring.r"
        fill="none"
        :stroke="ring.color"
        stroke-width="1"
        stroke-linecap="round"
        :stroke-dasharray="`${ring.dasharray} ${ring.dasharray}`"
        :stroke-dashoffset="ring.dasharray"
        :style="{
          // 动态 dasharray 用于 ringDrawIn / ringExtinguish 动画
          '--ring-dasharray': `${ring.dasharray}px`,
          'animation-delay': `${ring.delay}s`,
        }"
      />
    </g>
  </svg>
</template>

<style scoped lang="scss">
.hero-rings__svg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 700px;
  height: 700px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hero-rings__ring-wrap {
  transform-origin: center;
  transform-box: fill-box;
}

.hero-rings__ring {
  transform-origin: center;
  opacity: 0;
  animation: ringDrawIn 2s ease forwards;
}

.hero-rings__ring.is-extinguished {
  animation: ringExtinguish 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: 0s !important;
}

@keyframes ringDrawIn {
  from {
    stroke-dashoffset: var(--ring-dasharray);
    opacity: 0;
  }
  to {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

@keyframes ringExtinguish {
  0% {
    stroke-dashoffset: 0;
    stroke-width: 2.5;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: calc(var(--ring-dasharray) * -1);
    stroke-width: 0;
    opacity: 0;
  }
}

html.dark .hero-rings__ring {
  filter: brightness(1.25);
}
</style>
