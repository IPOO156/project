<script setup lang="ts">
import type { GrowthExperience } from '../timeline-constants'
import { ElMessageBox } from 'element-plus'
import { FlaskConical, GraduationCap, HeartHandshake, Trash2, Trophy } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useScrollReveal } from '../composables/useScrollReveal'
import { findRingBySemester, getSemesterDisplayLabel } from '../timeline-constants'

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

async function handleDelete(event: MouseEvent) {
  event.stopPropagation()
  try {
    await ElMessageBox.confirm('确定删除这条成长经历吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    emit('delete', props.experience.id)
  } catch {
    // 用户取消，无需处理
  }
}

const ringColor = computed(() => findRingBySemester(props.experience.semester)?.color ?? '#8b6340')

function getTypeIcon(tag: string) {
  if (tag?.includes('竞赛')) return Trophy
  if (tag?.includes('科研')) return FlaskConical
  if (tag?.includes('实践')) return HeartHandshake
  if (tag?.includes('学业')) return GraduationCap
  return Trophy
}

function getTypeColor(tag: string): string {
  const colorMap: Record<string, string> = {
    竞赛: '#d4a574',
    科研: '#8b6340',
    实践: '#a67c52',
    学业: '#5a7c5a',
    技术: '#9a8474',
  }
  for (const [key, color] of Object.entries(colorMap)) {
    if (tag?.includes(key)) return color
  }
  return '#8b6340'
}

const nodeRef = ref<HTMLElement | null>(null)
const { isVisible } = useScrollReveal(nodeRef, {
  threshold: 0.25,
  rootMargin: '0px 0px -60px 0px',
})
</script>

<template>
  <div
    :id="`growth-node-${experience.id}`"
    ref="nodeRef"
    class="growth-node"
    :class="{ 'growth-node--odd': isOdd, 'growth-node--selected': isSelected, visible: isVisible }"
    :style="{ '--ring-color': ringColor }"
    @click="emit('click', experience.id)"
  >
    <div class="growth-card" :data-index="String(index + 1).padStart(2, '0')">
      <div class="card-top">
        <div
          v-if="experience.tags.length"
          class="card-type-indicator"
          :style="{ '--type-color': getTypeColor(experience.tags[0]) }"
        >
          <component :is="getTypeIcon(experience.tags[0])" :size="12" />
        </div>
        <span class="card-season-badge">{{ getSemesterDisplayLabel(experience.semester) }}</span>
        <span class="card-year-inline">{{ experience.date }}</span>
        <button class="delete-btn" aria-label="删除" title="删除" @click.stop="handleDelete">
          <Trash2 :size="16" />
        </button>
      </div>
      <h3 class="card-title">{{ experience.title }}</h3>
      <p class="card-body">{{ experience.description }}</p>

      <div class="card-skills">
        <div v-for="skill in experience.skills" :key="skill.name" class="card-skill">
          <div class="card-skill-header">
            <span class="card-skill-name">{{ skill.name }}</span>
            <span class="card-skill-pct">{{ skill.growth }}%</span>
          </div>
          <div class="card-skill-track">
            <div class="card-skill-fill" :style="{ '--fill-width': `${skill.growth}%` }" />
          </div>
        </div>
      </div>

      <div class="card-tags">
        <span v-for="tag in experience.tags" :key="tag" class="card-tag">{{ tag }}</span>
      </div>
    </div>

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
  opacity: 0;
  transform: translateY(48px) scale(0.96);
  filter: blur(2px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity, filter;
}

.growth-node--odd .growth-card {
  grid-column: 1;
}
.growth-node--odd .growth-spacer {
  grid-column: 3;
}
.growth-node:not(.growth-node--odd) .growth-spacer {
  grid-column: 1;
}
.growth-node:not(.growth-node--odd) .growth-card {
  grid-column: 3;
}

.growth-node.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.growth-node--selected .growth-card {
  border-color: var(--ring-color, var(--bark-light, #8b6340));
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.95);
  box-shadow:
    0 0 0 1.5px var(--ring-color, var(--bark-light, #8b6340)),
    0 18px 50px rgba(var(--gt-shadow-rgb, 26 18 10), 0.1),
    0 4px 12px rgba(var(--gt-shadow-rgb, 26 18 10), 0.05);
  transform: translateY(-3px) scale(1.01);
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

.growth-card {
  padding: 2rem 2rem 1.8rem;
  border-radius: $radius-2xl;
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.75);
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.08);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  transition:
    border-color 0.35s ease,
    background 0.35s ease,
    box-shadow 0.35s ease,
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, box-shadow;
}

.growth-card:hover {
  border-color: rgba(var(--gt-bark-rgb, 61 43 31), 0.15);
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.92);
  box-shadow:
    0 14px 44px rgba(var(--gt-shadow-rgb, 26 18 10), 0.08),
    0 3px 10px rgba(var(--gt-shadow-rgb, 26 18 10), 0.04);
  transform: translateY(-5px) scale(1.005);
}

.growth-card::before {
  content: attr(data-index);
  position: absolute;
  right: 12px;
  bottom: 6px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.5rem;
  font-weight: 700;
  color: rgba(var(--gt-bark-rgb, 61 43 31), 0.04);
  line-height: 1;
  pointer-events: none;
  z-index: 0;
}

/* 确保卡片内容在装饰序号之上 */
.growth-card > * {
  position: relative;
  z-index: 1;
}

.growth-card::after {
  content: '';
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--ring-color, var(--bark-light, #8b6340));
  opacity: 0.35;
  pointer-events: none;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.card-type-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(var(--gt-bark-rgb, 61 43 31), 0.06);
  color: var(--type-color, var(--gt-accent, #8b6340));
}

.card-season-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--ring-color, var(--bark-light, #8b6340));
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  padding: 0.25rem 0.7rem;
  border-radius: 100px;
  background: rgba(var(--gt-bark-rgb, 61 43 31), 0.02);
  flex-shrink: 0;
}

.card-year-inline {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 2px;
  color: var(--text-light, #9a8474);
}

.card-title {
  font-family: 'Instrument Serif', serif;
  font-size: 1.6rem;
  font-weight: 400;
  color: var(--bark-dark, #2d1e12);
  margin-bottom: 0.6rem;
  line-height: 1.3;
}

.card-body {
  font-size: 0.88rem;
  color: var(--text-mid, #6b5443);
  line-height: 1.9;
  margin-bottom: 1.2rem;
}

.card-skills {
  margin-bottom: 1.2rem;
}

.card-skill {
  margin-bottom: 0.6rem;
}

.card-skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.card-skill-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-mid, #6b5443);
}

.card-skill-pct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  color: var(--text-light, #9a8474);
}

.card-skill-track {
  height: 3px;
  background: rgba(var(--gt-bark-rgb, 61 43 31), 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.card-skill-fill {
  height: 100%;
  background: var(--ring-color, var(--bark-light, #8b6340));
  border-radius: 2px;
  width: 0;
  transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.growth-node.visible .card-skill-fill {
  width: var(--fill-width, 0%);
}

.growth-node.visible .card-skill:nth-child(1) .card-skill-fill {
  transition-delay: 0.12s;
}
.growth-node.visible .card-skill:nth-child(2) .card-skill-fill {
  transition-delay: 0.24s;
}
.growth-node.visible .card-skill:nth-child(3) .card-skill-fill {
  transition-delay: 0.36s;
}
.growth-node.visible .card-skill:nth-child(4) .card-skill-fill {
  transition-delay: 0.48s;
}
.growth-node.visible .card-skill:nth-child(5) .card-skill-fill {
  transition-delay: 0.6s;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 1rem;
}

.card-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 1.5px;
  padding: 0.3rem 0.65rem;
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.08);
  border-radius: 100px;
  color: var(--text-light, #9a8474);
  transition: all 0.3s;
}

.card-tag:hover {
  border-color: var(--ring-color, var(--bark-light, #8b6340));
  color: var(--ring-color, var(--bark-light, #8b6340));
}

.delete-btn {
  margin-left: auto;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(var(--gt-bark-rgb, 61 43 31), 0.1);
  background: rgba(var(--gt-card-rgb, 255 252 247), 0.85);
  color: var(--ring-color, var(--bark-light, #8b6340));
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.55;
  transform: scale(0.92);
  transition:
    opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
  will-change: transform, opacity;
}

.growth-card:hover .delete-btn,
.delete-btn:focus-visible {
  opacity: 1;
  transform: scale(1);
}

.delete-btn:hover {
  background: #b94e4e;
  border-color: #b94e4e;
  color: #fff;
  transform: scale(1.08);
}

.delete-btn:active {
  transform: scale(0.96);
}

@media (hover: none) {
  .delete-btn {
    opacity: 1;
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

  .growth-card {
    grid-column: 2 !important;
    padding: 1.25rem;
    border-radius: $radius-xl;
  }

  .growth-spacer {
    display: none;
  }

  .ring-marker-outer {
    width: 40px;
    height: 40px;
  }

  .card-title {
    font-size: 1.35rem;
  }

  .delete-btn {
    width: 32px;
    height: 32px;
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .growth-node {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    transition: none !important;
    will-change: auto !important;
  }

  .ring-marker-outer::before,
  .ring-marker-outer::after {
    animation: none !important;
  }

  .card-skill-fill {
    transition: none !important;
    width: var(--fill-width, 0%) !important;
  }
}
</style>
