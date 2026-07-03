<script setup lang="ts">
import type { GrowthExperience } from '../timeline-constants'
import { Trash2, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { getSemesterDisplayLabel } from '../timeline-constants'

interface Props {
  experience: GrowthExperience | null
  expandOrigin?: { x: number; y: number } | null
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expandOrigin: null,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'closed'): void
  (e: 'delete', id: string): void
}>()

const isOpen = ref(false)
const isAnimating = ref(false)
const originX = ref('50%')
const originY = ref('50%')
const origin = computed(() => `${originX.value} ${originY.value}`)

const semesterLabel = computed(() => {
  if (!props.experience) return ''
  return getSemesterDisplayLabel(props.experience.semester)
})

watch(
  [() => props.experience, () => props.visible, () => props.expandOrigin],
  async ([exp, visible, origin]) => {
    if (exp && visible && origin) {
      await openWithAnimation()
    } else if (!visible && isOpen.value) {
      closeWithAnimation()
    }
  },
  { immediate: true },
)

function setOrigin() {
  const origin = props.expandOrigin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  originX.value = `${origin.x}px`
  originY.value = `${origin.y}px`
}

async function openWithAnimation() {
  if (isOpen.value) return
  isAnimating.value = true
  setOrigin()
  await nextTick()
  // 双 rAF 确保浏览器先应用 transform-origin，再进入过渡状态
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isOpen.value = true
    })
  })
}

function closeWithAnimation() {
  if (!isOpen.value) {
    isAnimating.value = false
    emit('closed')
    return
  }
  isOpen.value = false
  setTimeout(() => {
    isAnimating.value = false
    emit('closed')
  }, 550)
}

function handleClose() {
  emit('close')
}

function handleDelete() {
  if (!props.experience) return
  // eslint-disable-next-line no-alert
  if (confirm('确定删除这条经历吗？')) {
    emit('delete', props.experience.id)
  }
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) handleClose()
}
</script>

<template>
  <div
    v-show="isAnimating || isOpen"
    class="experience-detail"
    :class="{ 'is-open': isOpen }"
    @click="handleBackdropClick"
  >
    <button class="detail-close" aria-label="关闭" title="关闭" @click.stop="handleClose">
      <X :size="24" />
    </button>

    <div v-if="experience" class="detail-content">
      <div class="detail-header">
        <span class="detail-semester">{{ semesterLabel }}</span>
        <span class="detail-date">{{ experience.date }}</span>
      </div>

      <h2 class="detail-title">{{ experience.title }}</h2>
      <p class="detail-desc">{{ experience.description }}</p>

      <div class="detail-tags">
        <span v-for="tag in experience.tags" :key="tag" class="detail-tag">{{ tag }}</span>
      </div>

      <div class="detail-skills">
        <h3 class="detail-subtitle">能力成长</h3>
        <div v-for="skill in experience.skills" :key="skill.name" class="detail-skill">
          <div class="skill-row">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-value">{{ skill.growth }}%</span>
          </div>
          <div class="skill-track">
            <div class="skill-fill" :style="{ '--skill-growth': `${skill.growth}%` }" />
          </div>
        </div>
      </div>

      <div class="detail-actions">
        <button class="detail-delete" aria-label="删除" title="删除" @click="handleDelete">
          <Trash2 :size="20" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.experience-detail {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(244, 239, 230, 0.98);
  overflow-y: auto;
  transform: scale(0);
  opacity: 0;
  border-radius: 50%;
  transform-origin: v-bind(origin);
  transition:
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.45s ease,
    border-radius 0.55s ease;
  will-change: transform, opacity, border-radius;
}

.experience-detail.is-open {
  transform: scale(1);
  opacity: 1;
  border-radius: 0;
}

.detail-close {
  position: fixed;
  top: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(61, 43, 31, 0.12);
  background: rgba(255, 252, 247, 0.8);
  color: #5c3d28;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;
}

.detail-close:hover {
  background: #5c3d28;
  color: #f4efe6;
  transform: rotate(90deg);
}

.detail-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 12vh 2rem 6rem;
  opacity: 0;
  transform: translateY(30px);
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.experience-detail.is-open .detail-content {
  opacity: 1;
  transform: translateY(0);
  transition-delay: 0.2s;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-semester {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #5c3d28;
  border: 1px solid rgba(61, 43, 31, 0.12);
  padding: 6px 14px;
  border-radius: 100px;
}

.detail-date {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #9a8474;
}

.detail-title {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 400;
  color: #2d1e12;
  margin-bottom: 1.5rem;
  line-height: 1.15;
}

.detail-desc {
  font-size: 1.15rem;
  color: #6b5443;
  line-height: 2;
  margin-bottom: 2.5rem;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 3rem;
}

.detail-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 1.5px;
  padding: 8px 14px;
  border: 1px solid rgba(61, 43, 31, 0.12);
  border-radius: 100px;
  color: #6b5443;
}

.detail-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #8b6340;
  margin-bottom: 1.5rem;
}

.detail-skills {
  max-width: 560px;
}

.detail-skill {
  margin-bottom: 1.5rem;
}

.skill-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.skill-name {
  font-size: 0.9rem;
  color: #6b5443;
}

.skill-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #9a8474;
}

.skill-track {
  height: 6px;
  background: rgba(61, 43, 31, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.skill-fill {
  width: var(--skill-growth, 0%);
  height: 100%;
  background: linear-gradient(to right, #8b6340, #c8943e);
  border-radius: 3px;
  transition: width 1s ease;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 3rem;
}

.detail-delete {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(61, 43, 31, 0.12);
  background: rgba(255, 252, 247, 0.8);
  color: #8b6340;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.detail-delete:hover {
  background: #b94e4e;
  border-color: #b94e4e;
  color: #fff;
  transform: rotate(-8deg) scale(1.08);
}

.detail-delete:active {
  transform: scale(0.96);
}

@media (max-width: 768px) {
  .detail-close {
    top: 1rem;
    right: 1rem;
  }

  .detail-content {
    padding: 10vh 1.25rem 4rem;
  }

  .detail-actions {
    margin-top: 2.5rem;
  }

  .detail-delete {
    width: 48px;
    height: 48px;
  }
}
</style>
