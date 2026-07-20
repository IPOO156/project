<script setup lang="ts">
/**
 * GrowthRecords - 成长记录列表
 *
 * 展示来自 archiveStore 的时间轴条目，按时间排序，带滚动渐入动画。
 */
import type { TimelineNode } from '@/shared/types/types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  events: TimelineNode[]
}>()

const typeLabels: Record<string, string> = {
  award: '奖项',
  practice: '实践',
  grade: '成绩',
  competition: '竞赛',
  internship: '实习',
  other: '其他',
}

const typeColors: Record<string, string> = {
  award: '#d4a574',
  practice: '#10b981',
  grade: '#2d5a87',
  competition: '#8b5cf6',
  internship: '#f59e0b',
  other: '#94a3b8',
}

const sorted = computed(() => [...props.events].sort((a, b) => b.date.localeCompare(a.date)))

/** 滚动渐入：使用 IntersectionObserver 给每张卡添加 .visible */
const listRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
const visibleIds = ref<Set<string>>(new Set())

onMounted(() => {
  // 兼容旧浏览器 & 用户偏好：默认全部显示
  if (
    typeof IntersectionObserver === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    visibleIds.value = new Set(sorted.value.map((e) => e.id))
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const id = (entry.target as HTMLElement).dataset.id
        if (!id) continue
        visibleIds.value.add(id)
        // 触发响应式
        visibleIds.value = new Set(visibleIds.value)
        observer?.unobserve(entry.target)
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )

  // 等 DOM 渲染完后挂载
  requestAnimationFrame(() => {
    const cards = listRef.value?.querySelectorAll<HTMLElement>('.growth-item')
    cards?.forEach((el) => observer?.observe(el))
  })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div v-if="events.length" ref="listRef" class="growth-list">
    <div
      v-for="(evt, i) in sorted"
      :key="evt.id"
      :data-id="evt.id"
      :class="{ visible: visibleIds.has(evt.id) }"
      :style="{ transitionDelay: `${Math.min(i, 6) * 60}ms` }"
    >
      <div class="growth-item__dot" :style="{ background: typeColors[evt.type] || '#94a3b8' }" />
      <div class="growth-item__body">
        <div class="growth-item__header">
          <span class="growth-item__type" :style="{ color: typeColors[evt.type] || '#94a3b8' }">
            {{ typeLabels[evt.type] || evt.type }}
          </span>
          <span class="growth-item__semester">{{ evt.semester }}</span>
          <span class="growth-item__date">{{ evt.date }}</span>
        </div>
        <h4 class="growth-item__title">{{ evt.title }}</h4>
        <p v-if="evt.description" class="growth-item__desc">{{ evt.description }}</p>
      </div>
    </div>
  </div>
  <el-empty v-else description="暂无成长记录" :image-size="60" />
</template>

<style scoped lang="scss">
.growth-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.growth-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition:
    border-color 0.2s,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.5s ease;
  opacity: 0;
  transform: translateY(14px);
  will-change: opacity, transform;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    border-color: #d4a574;
  }

  &__dot {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 5px;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
    font-size: 12px;
  }

  &__type {
    font-weight: 600;
    font-size: 12px;
  }

  &__semester,
  &__date {
    color: var(--el-text-color-secondary);
  }

  &__title {
    margin: 0 0 2px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .growth-item {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
