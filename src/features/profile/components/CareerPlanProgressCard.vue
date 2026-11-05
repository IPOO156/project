<script setup lang="ts">
/**
 * 计划完成进度卡片（纯展示）：进度仅基于本地已有数据（已填学期数）计算，由父级传入。
 */
defineProps<{
  /** 已制定规划的学期数 */
  filledSemesterCount: number
  /** 总学期数（useSemesters 选项数，与学期下拉同源） */
  totalSemesterCount: number
  /** 完成百分比（0-100） */
  planProgressPercent: number
  /** 已提交规划份数 */
  planCount: number
}>()
</script>

<template>
  <el-card class="gd-card gd-card--progress">
    <template #header><span class="card-title">计划完成进度</span></template>
    <div class="plan-progress">
      <div class="plan-progress__stat">
        <span class="plan-progress__num">{{ filledSemesterCount }}</span>
        <span class="plan-progress__total">/ {{ totalSemesterCount }} 个学期已制定规划</span>
      </div>
      <el-progress :percentage="planProgressPercent" :stroke-width="10" />
      <p class="plan-progress__hint">
        已提交规划 {{ planCount }} 份，覆盖 {{ filledSemesterCount }} 个学期。
      </p>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.gd-card {
  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.plan-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__stat {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__num {
    font-size: 28px;
    font-weight: 700;
    color: #d4a574;
  }

  &__total {
    font-size: 14px;
    color: #64748b;
  }

  &__hint {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
  }
}

// ─── 夜间模式适配 ───
html.dark {
  .card-title {
    color: #f1f5f9;
  }
}
</style>
