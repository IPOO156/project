<script setup lang="ts">
/**
 * AwardReview - 奖项审核
 *
 * 查看竞赛之星/科研之星/双创之星的报名审核状态。
 * 待审核或被驳回的可编辑修改，已通过的仅可查看。
 */
import PageContainer from '@/shared/ui/PageContainer.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import StarSection from './components/StarSection.vue'
</script>

<template>
  <PageContainer>
    <PageHeader
      title="奖项审核"
      subtitle="查看竞赛之星/科研之星/双创之星的报名审核状态，待审核或被驳回的报名可修改后重新提交"
    />
    <div class="award-content">
      <StarSection />
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
.award-content {
  margin-top: 24px;
}
</style>
