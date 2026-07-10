<script setup lang="ts">
/**
 * AwardReview - 奖项审核
 *
 * 查看竞赛之星/科研之星/双创之星的报名审核状态。
 * hero 头部 + 统计卡 + Tab 切换，全部由 StarSection 自包含。
 */
import PageContainer from '@/shared/ui/PageContainer.vue'
import StarSection from './components/StarSection.vue'
</script>

<template>
  <PageContainer>
    <StarSection />
  </PageContainer>
</template>

<style scoped lang="scss">
// 样式由 StarSection 内部自包含，此处无需额外样式
</style>
