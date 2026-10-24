<script setup lang="ts">
interface Props {
  /** 组织汇总聚合后的 KPI（由父页面按 overview 行汇总） */
  kpis: {
    studentCount: number
    archiveCount: number
    approvedCount: number
    pendingCount: number
    rejectedCount: number
    submittedCount: number
  }
}

defineProps<Props>()
</script>

<template>
  <!-- KPI 摘要 -->
  <section class="archive-view__kpis" aria-label="档案汇总概览">
    <article class="archive-view__kpi archive-view__kpi--primary">
      <p class="archive-view__kpi-label">覆盖学生</p>
      <p class="archive-view__kpi-value mc-num">
        {{ kpis.studentCount }}
        <span class="archive-view__kpi-unit">人</span>
      </p>
      <p class="archive-view__kpi-foot">档案组织范围下的学生数量</p>
    </article>
    <article class="archive-view__kpi">
      <p class="archive-view__kpi-label">档案总数</p>
      <p class="archive-view__kpi-value mc-num">
        {{ kpis.archiveCount }}
        <span class="archive-view__kpi-unit">份</span>
      </p>
      <p class="archive-view__kpi-foot">含已提交的全部档案记录</p>
    </article>
    <article class="archive-view__kpi archive-view__kpi--success">
      <p class="archive-view__kpi-label">已通过</p>
      <p class="archive-view__kpi-value mc-num">
        {{ kpis.approvedCount }}
        <span class="archive-view__kpi-unit">份</span>
      </p>
      <p class="archive-view__kpi-foot">审批通过的档案数量</p>
    </article>
    <article class="archive-view__kpi archive-view__kpi--warning">
      <p class="archive-view__kpi-label">待审批</p>
      <p class="archive-view__kpi-value mc-num">
        {{ kpis.pendingCount }}
        <span class="archive-view__kpi-unit">份</span>
      </p>
      <p class="archive-view__kpi-foot">提交后等待审批的档案</p>
    </article>
    <article class="archive-view__kpi archive-view__kpi--danger">
      <p class="archive-view__kpi-label">已退回</p>
      <p class="archive-view__kpi-value mc-num">
        {{ kpis.rejectedCount }}
        <span class="archive-view__kpi-unit">份</span>
      </p>
      <p class="archive-view__kpi-foot">需要修改后重新提交</p>
    </article>
  </section>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.archive-view {
  /* ── KPI 卡（横向 5 列）── */
  &__kpis {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $spacing-lg;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(3, 1fr);
    }
    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  &__kpi {
    position: relative;
    padding: 18px 20px 16px;
    border-radius: $radius-lg;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    overflow: hidden;
    transition:
      transform 0.25s $ease-standard,
      box-shadow 0.25s $ease-standard,
      border-color 0.25s $ease-standard;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 14px;
      bottom: 14px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: var(--el-color-primary-light-7);
    }

    &:hover {
      transform: translateY(-2px);
      border-color: rgba($color-accent, 0.3);
      box-shadow: 0 4px 14px -6px rgba($color-primary, 0.15);
    }

    &--primary::before {
      background: var(--el-color-primary);
    }
    &--success::before {
      background: $color-success;
    }
    &--warning::before {
      background: $color-warning;
    }
    &--danger::before {
      background: $color-danger;
    }
  }
  &__kpi-label {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.04em;
  }
  &__kpi-value {
    margin: 6px 0 4px;
    font-size: 28px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.15;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
  }
  &__kpi-unit {
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
  &__kpi-foot {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    line-height: 1.5;
  }
}
</style>
