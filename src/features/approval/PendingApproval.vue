<script setup lang="ts">
/**
 * DeclarationReview - 申报审核
 *
 * 查看个人档案信息 10 个申报类型的申报状态与审核进度。
 * 支持 Tab 切换（全部 + 各类型独立 Tab）和动态筛选。
 */
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import ReviewSection from './components/ReviewSection.vue'
</script>

<template>
  <PageContainer>
    <PageHeader
      title="申报审核"
      subtitle="查看各类型申报信息的提交状态与审核进度。待审核或被驳回的申报可点击编辑修改后重新提报"
    />
    <div class="review-content">
      <ReviewSection />
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
.review-content {
  margin-top: 24px;
}
</style>
