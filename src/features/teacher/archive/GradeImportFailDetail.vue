<script setup lang="ts">
import type { GradeImportFailItem } from '@/shared/types/teacher'

defineProps<{ items: GradeImportFailItem[] }>()
</script>

<template>
  <div class="grade-import__detail-section">
    <p class="grade-import__detail-title">失败明细（{{ items.length }} 条）</p>
    <el-table v-if="items.length" class="u-w-full" :data="items" stripe max-height="360">
      <el-table-column prop="row" label="行号" width="80" align="center" />
      <el-table-column prop="studentNo" label="学号" width="130" />
      <el-table-column prop="reason" label="失败原因" min-width="200" />
    </el-table>
    <el-empty v-else description="无失败明细" :image-size="72" />
  </div>
</template>

<style scoped lang="scss">
.grade-import {
  &__detail {
    &-section {
      margin-top: $spacing-md;
    }
    &-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 $spacing-sm;
    }
  }
}
</style>
