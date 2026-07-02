<script setup lang="ts">
/**
 * PageContainer - 页面级内容容器
 *
 * 集成 loading / empty / error 三种状态。
 *
 * 用法：
 * <PageContainer :loading="loading" :empty="list.length === 0" :error="!!error" @retry="fetch">
 *   <el-table :data="list">...</el-table>
 * </PageContainer>
 *
 * 标题区可由父组件使用 PageHeader + PageToolbar 组合：
 * <template #header>...</template>
 * <template #toolbar>...</template>
 */
interface Props {
  /** 是否正在加载 */
  loading?: boolean
  /** 是否为空数据 */
  empty?: boolean
  /** 是否错误 */
  error?: boolean
  /** 空状态描述 */
  emptyText?: string
  /** 卡片是否有 padding */
  noPadding?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
  empty: false,
  error: false,
  emptyText: '暂无数据',
  noPadding: false,
})

const emit = defineEmits<{
  retry: []
}>()

function handleRetry() {
  emit('retry')
}
</script>

<template>
  <div class="page-container">
    <!-- 加载骨架 -->
    <el-skeleton v-if="loading" :rows="6" animated class="page-container__skeleton" />

    <!-- 错误 -->
    <el-result
      v-else-if="error"
      icon="error"
      title="加载失败"
      sub-title="请检查网络后重试"
      class="page-container__error"
    >
      <template #extra>
        <el-button type="primary" @click="handleRetry">重试</el-button>
      </template>
    </el-result>

    <!-- 空数据 -->
    <el-empty
      v-else-if="empty"
      :description="emptyText"
      class="page-container__empty"
    >
      <slot name="empty" />
    </el-empty>

    <!-- 正常内容 -->
    <div v-else class="page-container__body" :class="{ 'page-container__body--flush': noPadding }">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  box-shadow: $shadow-base;
  overflow: hidden;

  &__body {
    padding: $spacing-xl;
  }

  &__body--flush {
    padding: 0;
  }

  &__skeleton {
    padding: $spacing-xl;
  }

  &__empty,
  &__error {
    padding: $spacing-2xl;
  }
}
</style>
