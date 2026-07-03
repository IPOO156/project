<script setup lang="ts">
import type { GrowthExperience } from '../constants'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
  experiences: GrowthExperience[]
}

const props = defineProps<Props>()

const activeIndex = ref<number>(-1)
let observer: IntersectionObserver | null = null

function getNodeId(experienceId: string): string {
  return `growth-node-${experienceId}`
}

function isDotActive(index: number): boolean {
  return activeIndex.value >= 0 && index <= activeIndex.value
}

function scrollToNode(index: number) {
  const exp = props.experiences[index]
  if (!exp) return

  const el = document.getElementById(getNodeId(exp.id))
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function findScrollRoot(): Element | null {
  // 成长时间轴页面实际滚动容器是 DefaultLayout 的 .layout__content
  const layoutContent = document.querySelector('.layout__content')
  if (layoutContent) return layoutContent

  // 兜底：从组件自身向上查找第一个可滚动祖先
  let el = document.querySelector('.progress-indicator')?.parentElement
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el)
    const canScroll = style.overflowY === 'auto' || style.overflowY === 'scroll'
    if (canScroll) return el
    el = el.parentElement
  }
  return null
}

function setupObserver() {
  observer?.disconnect()

  if (!props.experiences.length) return

  const root = findScrollRoot()

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        const index = props.experiences.findIndex((exp) => getNodeId(exp.id) === entry.target.id)
        if (index !== -1) activeIndex.value = Math.max(activeIndex.value, index)
      })
    },
    {
      root,
      threshold: 0.25,
      rootMargin: '0px 0px -60px 0px',
    },
  )

  props.experiences.forEach((exp) => {
    const el = document.getElementById(getNodeId(exp.id))
    if (el) observer?.observe(el)
  })
}

onMounted(() => {
  setupObserver()
})

watch(
  () => props.experiences,
  async () => {
    await nextTick()
    setupObserver()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="progress-indicator">
    <template v-for="(exp, index) in experiences" :key="exp.id">
      <button
        class="progress-dot"
        :class="{ active: isDotActive(index) }"
        :aria-label="exp.title"
        @click="scrollToNode(index)"
      />
      <div v-if="index < experiences.length - 1" class="progress-line" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.progress-indicator {
  position: fixed;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid #8b6340;
  background: transparent;
  transition: all 0.4s ease;
  cursor: pointer;
  position: relative;
  padding: 0;
}

.progress-dot.active {
  background: #5c3d28;
  border-color: #5c3d28;
  box-shadow: 0 0 8px rgba(92, 61, 40, 0.2);
}

.progress-dot.active::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #8b6340;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pingDot 2s ease-out infinite;
}

@keyframes pingDot {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.progress-line {
  width: 1px;
  height: 20px;
  background: rgba(61, 43, 31, 0.15);
}

@media (max-width: 768px) {
  .progress-indicator {
    right: 1rem;
    gap: 0.5rem;
  }

  .progress-dot {
    width: 6px;
    height: 6px;
  }

  .progress-line {
    height: 14px;
  }
}
</style>
