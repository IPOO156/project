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
  <section class="activities-card" aria-label="最近动态">
    <header class="activities-card__head">
      <h2 class="activities-card__title">最近动态</h2>
      <button type="button" class="link-btn" @click="emit('viewAll')">查看全部</button>
    </header>

    <div v-loading="loading" class="activities-card__body">
      <div v-if="activities.length" class="acts">
        <div v-for="act in activities" :key="act.id" class="act">
          <span class="act__dot" :class="`act__dot--${act.type}`" aria-hidden="true" />
          <span class="act__text">{{ act.text }}</span>
          <StatusTag :status="act.status" size="small" />
          <span class="act__time">{{ act.time }}</span>
        </div>
      </div>

      <div v-else-if="!loading" class="acts acts--empty">
        <div class="act act--slot">
          <span class="act__dot act__dot--off" aria-hidden="true" />
          <span class="act__text">暂无动态</span>
          <span class="act__time">—</span>
        </div>
        <div class="act act--slot">
          <span class="act__dot act__dot--off" aria-hidden="true" />
          <span class="act__text">申报、材料与审核记录会出现在这里</span>
          <span class="act__time">—</span>
        </div>
        <div class="act act--slot act--tip">
          <StudyTipInline compact />
        </div>
      </div>

      <div v-else class="acts acts--loading" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.activities-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.activities-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.activities-card__title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.link-btn {
  padding: 0;
  border: 0;
  background: transparent;
  font-size: $font-size-base;
  color: var(--el-color-primary);
  cursor: pointer;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}

.activities-card__body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 6px 12px;
}

.acts {
  display: flex;
  flex-direction: column;
  height: 100%;

  &--loading {
    min-height: 120px;
  }
}

.act {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 0 6px;
  border-bottom: 1px solid var(--el-border-color-light);

  &:last-child {
    border-bottom: none;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex: 0 0 7px;

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
    &--off {
      background: transparent;
      border: 1px dashed var(--el-border-color);
    }
  }

  &__text {
    flex: 1;
    min-width: 0;
    font-size: $font-size-base;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    flex-shrink: 0;
    font-size: $font-size-xs;
    color: var(--el-text-color-placeholder);
    font-variant-numeric: tabular-nums;
  }

  &--slot {
    color: var(--el-text-color-placeholder);

    .act__text {
      color: var(--el-text-color-placeholder);
    }
  }

  &--tip {
    border-bottom: none;
    padding: 8px;
  }
}
</style>
