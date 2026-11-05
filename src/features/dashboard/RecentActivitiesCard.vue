<script setup lang="ts">
import type { Activity } from '@/shared/types/types'
import StatusTag from '@/shared/ui/StatusTag.vue'
import StudyTipInline from '@/shared/ui/StudyTipInline.vue'

defineProps<{
  activities: Activity[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'viewAll'): void
}>()
</script>

<template>
  <el-card class="dashboard__section dashboard__section--activities">
    <template #header>
      <div class="dashboard__section-header">
        <span class="section-title">最近动态</span>
        <el-button link type="primary" @click="emit('viewAll')">查看全部</el-button>
      </div>
    </template>
    <div v-loading="loading" class="activities">
      <div v-for="act in activities" :key="act.id" class="activity-item">
        <div class="activity-item__dot" :class="`activity-item__dot--${act.type}`" />
        <div class="activity-item__content">
          <div class="activity-item__title-row">
            <p class="activity-item__text">{{ act.text }}</p>
            <StatusTag :status="act.status" size="small" />
          </div>
          <span class="activity-item__time">{{ act.time }}</span>
        </div>
      </div>
      <el-empty v-if="!loading && activities.length === 0" description="暂无动态">
        <StudyTipInline compact />
      </el-empty>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.dashboard__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.activities {
  max-height: 240px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-light);

  &:last-child {
    border-bottom: none;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;

    &--draft {
      background: #909399;
    }
    &--submitted {
      background: #e6a23c;
    }
    &--approved {
      background: #67c23a;
    }
    &--rejected {
      background: #f56c6c;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;

    p {
      font-size: 14px;
      color: var(--el-text-color-primary);
      margin-bottom: 2px;
    }
  }

  &__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
