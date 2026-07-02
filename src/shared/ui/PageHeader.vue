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
  /** 是否显示装饰条 */
  decoration?: boolean
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  size: 'md',
  decoration: true,
})
</script>

<template>
  <div
    class="page-header"
    :class="[
      `page-header--${size}`,
      { 'page-header--plain': !decoration },
    ]"
  >
    <div class="page-header__main">
      <h2 class="page-header__title">
        <span v-if="decoration" class="page-header__bar" aria-hidden="true" />
        {{ title }}
      </h2>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-xl;
  flex-wrap: wrap;

  &__main {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin: 0;
    color: var(--el-text-color-primary);
    font-weight: 600;
    line-height: 1.4;
  }

  &--sm &__title { font-size: $font-size-lg; }
  &--md &__title { font-size: $font-size-xl; }
  &--lg &__title { font-size: $font-size-2xl; }

  &__bar {
    display: inline-block;
    width: 4px;
    height: 1em;
    background: linear-gradient(
      180deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light) 100%
    );
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__subtitle {
    margin: $spacing-sm 0 0;
    color: var(--el-text-color-secondary);
    font-size: $font-size-base;
    line-height: 1.5;
  }

  &__actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  &--plain &__bar {
    display: none;
  }
}
</style>
