<script setup lang="ts">
/**
 * ReviewSummary - 申报审核页头部与统计摘要（待审核 / 已通过 / 已驳回）
 *
 * 纯展示子组件：统计数据由父组件 ReviewSection 从 store 派生后传入。
 */
import type { Component } from 'vue'
import { FileText } from 'lucide-vue-next'

interface Props {
  stats: { label: string; value: number; icon: Component; color: string }[]
}

defineProps<Props>()
</script>

<template>
  <header class="review-section__hero">
    <div class="review-section__hero-main">
      <div class="review-section__hero-icon">
        <FileText :size="28" />
      </div>
      <div>
        <h1 class="review-section__hero-title">申报审核</h1>
        <p class="review-section__hero-subtitle">
          查看各类型申报信息的提交状态与审核进度。待审核或被驳回的申报可点击编辑修改后重新提报
        </p>
      </div>
    </div>
    <div class="review-section__hero-stats">
      <div v-for="stat in stats" :key="stat.label" class="review-section__hero-stat">
        <div class="review-section__hero-stat-main" :style="{ color: stat.color }">
          <component :is="stat.icon" :size="18" />
          <span class="review-section__hero-stat-value">{{ stat.value }}</span>
        </div>
        <span class="review-section__hero-stat-label">{{ stat.label }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/features/messages/styles/theme' as *;

// hero 头部
.review-section__hero {
  @include mc-fade-in;

  background: var(--mc-card);
  border: 1px solid var(--mc-border);
  border-radius: var(--mc-radius);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  box-shadow: var(--mc-shadow);
}

.review-section__hero-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.review-section__hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--mc-wood);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.review-section__hero-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.review-section__hero-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--mc-text-secondary);
}

.review-section__hero-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.review-section__hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 90px;
  padding: 10px 16px;
  background: var(--mc-bg);
  border: 1px solid var(--mc-border);
  border-radius: 8px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--mc-wood);
    box-shadow: 0 2px 8px var(--mc-primary-fade);
  }
}

.review-section__hero-stat-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.review-section__hero-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.review-section__hero-stat-label {
  font-size: 12px;
  color: var(--mc-text-secondary);
}
</style>
