<script setup lang="ts">
/**
 * PageHeader - 页面级统一标题组件
 *
 * 用法（与 DefaultLayout 配合）：
 * <template #header>
 *   <PageHeader title="奖学金申报" subtitle="提交奖学金申请并跟踪审批进度" />
 * </template>
 *
 * 也可独立使用：
 * <PageHeader title="标题" subtitle="副标题">
 *   <template #actions>
 *     <el-button type="primary">新增</el-button>
 *   </template>
 * </PageHeader>
 */
interface Props {
  /** 主标题 */
  title: string
  /** 副标题/描述（可选） */
  subtitle?: string
  /** 字号级别 */
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  size: 'md',
})
</script>

<template>
  <div class="page-header" :class="`page-header--${size}`">
    <div class="page-header__main">
      <h2 class="page-header__title">{{ title }}</h2>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 与「成长发展」页头同款：26px 标题 + 16px 副标题，底部 12px 留白与 1px 分隔线 */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-xl;
  flex-wrap: wrap;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $color-border;

  &__main {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__title {
    margin: 0 0 6px;
    color: $color-text-primary;
    font-size: $font-size-page-title;
    font-weight: 700;
    line-height: $line-height-title;
  }

  &--sm &__title {
    font-size: $font-size-xl;
  }
  &--md &__title {
    font-size: $font-size-page-title;
  }
  &--lg &__title {
    font-size: $font-size-4xl;
  }

  &__subtitle {
    margin: 0;
    color: $color-text-secondary;
    font-size: $font-size-lg;
    line-height: $line-height-body;
  }

  &__actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }
}
</style>
