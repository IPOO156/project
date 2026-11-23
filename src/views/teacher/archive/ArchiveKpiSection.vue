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
  /* ── KPI：1 个主指标 + 4 个次要指标，横向分层，不再五等分 ── */
  &__kpis {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr));
    gap: $spacing-md;

    @media (max-width: 1100px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
  &__kpi {
    position: relative;
    padding: 16px 16px 16px;
    border-radius: $radius-card;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    transition: none;

    /* 层级用左侧 3px 状态色条区分，不再靠悬浮阴影 / 位移 */
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--el-border-color);
    }

    &:hover {
      border-color: var(--el-border-color-lighter);
      box-shadow: none;
      transform: none;
    }

    &--primary {
      background: var(--el-fill-color-lighter);

      &::before {
        background: var(--el-color-primary);
      }

      .archive-view__kpi-value {
        font-size: 32px;
      }
    }
    &--success::before {
      background: var(--mc-success, #15803d);
    }
    &--warning::before {
      background: var(--mc-warning, #b45309);
    }
    &--danger::before {
      background: var(--mc-danger, #b91c1c);
    }
  }
  &__kpi-label {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0;
  }
  &__kpi-value {
    margin: 4px 0 4px;
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
  }
  &__kpi-unit {
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }
  &__kpi-foot {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}
</style>
