<script setup lang="ts">
import type { GrowthExperience } from '../timeline-constants'
import { computed } from 'vue'
import { findRingBySemester, SEMESTER_RINGS } from '../timeline-constants'

interface Props {
  experiences: GrowthExperience[]
}

const props = defineProps<Props>()

const progressPercent = computed(() => {
  if (props.experiences.length === 0) return 0
  const maxLevel = props.experiences.reduce((max, exp) => {
    const ring = findRingBySemester(exp.semester)
    return Math.max(max, ring?.level ?? 1)
  }, 1)
  return Math.round((maxLevel / SEMESTER_RINGS.length) * 100)
})
</script>

<template>
  <div class="hero-rings__footer">
    <div class="hero-rings__data-row">
      <div class="hero-rings__data-item">
        <div class="hero-rings__data-value">{{ experiences.length }}</div>
        <div class="hero-rings__data-unit">Experiences</div>
      </div>
      <div class="hero-rings__data-item">
        <div class="hero-rings__data-value">{{ SEMESTER_RINGS.length }}</div>
        <div class="hero-rings__data-unit">Rings</div>
      </div>
      <div class="hero-rings__data-item">
        <div class="hero-rings__data-value">
          {{ experiences.reduce((sum, e) => sum + e.skills.length, 0) }}
        </div>
        <div class="hero-rings__data-unit">Skills</div>
      </div>
    </div>

    <div class="hero-rings__progress">
      <span class="hero-rings__progress-label">当前进度</span>
      <div class="hero-rings__progress-bar">
        <div class="hero-rings__progress-fill" :style="{ width: `${progressPercent}%` }" />
      </div>
      <span class="hero-rings__progress-pct">{{ progressPercent }}%</span>
    </div>
  </div>
</template>

<style scoped>
.hero-rings__footer {
  opacity: 0;
  animation: fadeSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 1.2s;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-rings__data-row {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 3rem;
}

.hero-rings__data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-width: 80px;
}

.hero-rings__data-value {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3rem;
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--bark-dark, #2d1e12);
  line-height: 1;
  font-variant-numeric: tabular-nums lining-nums;
}

.hero-rings__data-unit {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--text-light, #9a8474);
}

.hero-rings__progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.hero-rings__progress-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-light, #9a8474);
  white-space: nowrap;
}

.hero-rings__progress-bar {
  flex: 1;
  width: 140px;
  max-width: 140px;
  height: 4px;
  background: rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.hero-rings__progress-fill {
  height: 100%;
  background: var(--gt-accent, #8b6340);
  border-radius: 2px;
  transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s;
}

.hero-rings__progress-pct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  color: var(--gt-accent, #8b6340);
  min-width: 32px;
  text-align: right;
}

@media (prefers-reduced-motion: reduce) {
  .hero-rings__footer {
    animation: none !important;
    opacity: 1 !important;
  }
}
</style>
