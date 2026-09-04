<script setup lang="ts">
// 档案数据完整度进度条：百分比大号突出显示，进度条颜色与页面主色一致（蓝色 #4a7fb5，同 ProfileInfo DIMENSION_COLORS_LIGHT）
// 数据源：GET /profile/data-completeness → overallRate（后端评分重算 recalculateForStudent 写入 data_completeness 表）
defineProps<{ rate: number }>()

/** 与页面主色一致的进度条颜色 */
const BAR_COLOR = '#4a7fb5'
</script>

<template>
  <div class="completeness-bar">
    <span class="completeness-bar__label">档案数据完整度</span>
    <el-progress
      :percentage="rate"
      :stroke-width="14"
      :color="BAR_COLOR"
      class="completeness-bar__progress"
      :show-text="false"
    />
    <span class="completeness-bar__value">{{ rate }}%</span>
  </div>
</template>

<style scoped lang="scss">
.completeness-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;

  &__label {
    font-size: 13px;
    color: #475569;
    white-space: nowrap;
  }

  &__progress {
    flex: 1;
    min-width: 200px;
  }

  &__value {
    min-width: 52px;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    text-align: right;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
}
</style>
