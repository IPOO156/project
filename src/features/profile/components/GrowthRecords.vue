<script setup lang="ts">
/**
 * GrowthRecords - 成长记录列表
 *
 * 展示来自 archiveStore 的时间轴条目，按时间排序。
 */
import type { TimelineNode } from '@/shared/types/types'
import { computed } from 'vue'

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
</script>

<template>
  <div v-if="events.length" class="growth-list">
    <div v-for="evt in sorted" :key="evt.id" class="growth-item">
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
  transition: border-color 0.2s;

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
</style>
