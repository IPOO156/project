<script setup lang="ts">
/**
 * DeclarationReview - 申报审核
 *
 * 查看个人档案信息 10 个申报类型的申报状态与审核进度。
 * hero 头部 + 统计卡 + Tab 切换 + 动态筛选，全部由 ReviewSection 自包含。
 */
import PageContainer from '@/shared/ui/PageContainer.vue'
import ReviewSection from './components/ReviewSection.vue'
</script>

<template>
  <PageContainer>
    <ReviewSection />
  </PageContainer>
</template>

<style scoped lang="scss">
// 样式由 ReviewSection 内部自包含，此处无需额外样式
</style>
