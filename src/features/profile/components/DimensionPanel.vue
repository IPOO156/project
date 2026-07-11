<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  dimensions: Array<{
    label: string
    score: number
    color: string
  }>
}>()

const avgScore = computed(() => {
  if (props.dimensions.length === 0) return 0
  const total = props.dimensions.reduce((s, d) => s + d.score, 0)
  return Math.round(total / props.dimensions.length)
})
</script>

<template>
  <el-card class="profile-card dimension-panel">
    <template #header>
      <div class="card-header">
        <div class="card-header__left">
          <TrendingUp :size="16" />
          <span>多维度画像</span>
        </div>
        <span class="card-header__tag">综合评分 {{ avgScore }}分</span>
      </div>
    </template>
    <div class="dimension-list">
      <div v-for="dim in dimensions" :key="dim.label" class="dimension-item">
        <div class="dimension-item__head">
          <span class="dimension-item__label">{{ dim.label }}</span>
          <span class="dimension-item__score" :style="{ color: dim.color }">{{ dim.score }}分</span>
        </div>
        <el-progress
          :percentage="dim.score"
          :color="dim.color"
          :stroke-width="8"
          :format="() => ''"
          class="dimension-item__bar"
        />
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.dimension-panel {
  margin-bottom: 0;

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-primary);
  }

  &__tag {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    padding: 2px 10px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
  }
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dimension-item {
  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  &__score {
    font-size: 13px;
    font-weight: 600;
  }

  &__bar {
    :deep(.el-progress-bar__outer) {
      background-color: var(--el-fill-color-light);
    }
  }
}
</style>
