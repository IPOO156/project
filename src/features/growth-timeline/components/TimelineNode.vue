<script setup lang="ts">
import type { GrowthExperience } from '../timeline-constants'
import { computed, ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'
import { findRingBySemester } from '../timeline-constants'
import GrowthCard from './GrowthCard.vue'

interface Props {
  experience: GrowthExperience
  index: number
  isOdd: boolean
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
})

const emit = defineEmits<{
  (e: 'click', id: string): void
  (e: 'delete', id: string): void
}>()

const ringColor = computed(() => findRingBySemester(props.experience.semester)?.color ?? '#8b6340')

const nodeRef = ref<HTMLElement | null>(null)
const { isVisible } = useScrollReveal(nodeRef, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px',
  once: false,
})
</script>

<template>
  <div
    :id="`growth-node-${experience.id}`"
    ref="nodeRef"
    class="growth-node"
    :class="{ 'growth-node--odd': isOdd, 'growth-node--selected': isSelected, visible: isVisible }"
    :style="{ '--ring-color': ringColor, '--stagger-delay': `${index * 0.08}s` }"
    @click="emit('click', experience.id)"
  >
    <GrowthCard
      :experience="experience"
      :index="index"
      :is-visible="isVisible"
      :is-selected="isSelected"
      :ring-color="ringColor"
      @click="emit('click', $event)"
      @delete="emit('delete', $event)"
    />

    <div class="ring-marker">
      <div class="ring-marker-outer">
        <div class="ring-marker-core" />
      </div>
    </div>

    <div class="growth-spacer" />
  </div>
</template>

<style scoped lang="scss">
.growth-node {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  align-items: start;
  margin-bottom: 5rem;
  cursor: pointer;
  user-select: none;
}

/* 进入动画：轨道标记默认隐藏，滚动进入视图后一次性淡入 */
.ring-marker {
  opacity: 0;
  transform: translateY(34px) scale(0.96);
}

.growth-node.visible .ring-marker {
  animation: gt-marker-enter 0.85s cubic-bezier(0.16, 1, 0.3, 1) var(--stagger-delay, 0s) both;
}

@keyframes gt-marker-enter {
  from {
    opacity: 0;
    transform: translateY(34px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.growth-node--odd :deep(.growth-card) {
  grid-column: 1;
}
.growth-node--odd .growth-spacer {
  grid-column: 3;
}
.growth-node:not(.growth-node--odd) .growth-spacer {
  grid-column: 1;
}
.growth-node:not(.growth-node--odd) :deep(.growth-card) {
  grid-column: 3;
}

.ring-marker {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 2rem;
  grid-column: 2;
  grid-row: 1;
}

.ring-marker-outer {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-marker-outer::before,
.ring-marker-outer::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid var(--ring-color, var(--bark-light, #8b6340));
  opacity: 0.5;
  animation: markerBreath 4s ease-in-out infinite;
}

.ring-marker-outer::before {
  width: 100%;
  height: 100%;
}

.ring-marker-outer::after {
  width: 80%;
  height: 80%;
  opacity: 0.3;
  animation-delay: 1s;
}

@keyframes markerBreath {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.2;
  }
}

.ring-marker-core {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ring-color, var(--bark-light, #8b6340));
  z-index: 1;
  box-shadow: 0 0 12px rgba(var(--gt-accent-rgb, 139 99 64), 0.25);
}

.growth-node.visible .ring-marker-outer {
  animation: ringMarkerPulse 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes ringMarkerPulse {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .growth-node {
    grid-template-columns: 44px 1fr;
    gap: 0 0.75rem;
    margin-bottom: 3rem;
  }

  .ring-marker {
    grid-column: 1 !important;
    grid-row: 1;
    padding-top: 1.25rem;
  }

  :deep(.growth-card) {
    grid-column: 2 !important;
  }

  .growth-spacer {
    display: none;
  }

  .ring-marker-outer {
    width: 40px;
    height: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .growth-node.visible .ring-marker {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .ring-marker-outer::before,
  .ring-marker-outer::after {
    animation: none !important;
  }
}
</style>
