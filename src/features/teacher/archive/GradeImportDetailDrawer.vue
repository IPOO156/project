<script setup lang="ts">
import type { GradeImportDetail } from '@/shared/types/teacher'
import GradeImportFailDetail from './GradeImportFailDetail.vue'

defineProps<{
  loading: boolean
  detail: GradeImportDetail | null
  fileName: string
}>()

const emit = defineEmits<{
  (e: 'closed'): void
}>()

const visible = defineModel<boolean>({ required: true })

function importStatusType(status: number | null) {
  return status === 1 ? 'success' : status === 2 ? 'danger' : 'warning'
}
</script>

<template>
  <el-drawer
    v-model="visible"
    title="导入详情"
    size="42%"
    :destroy-on-close="true"
    @closed="emit('closed')"
  >
    <div v-loading="loading" class="grade-import__detail">
      <template v-if="detail">
        <div class="grade-import__detail-summary">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="学期">{{
              detail.semesterName ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="文件名">{{ fileName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作人">{{
              detail.operatorName ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="importStatusType(detail.importStatus)" size="small">
                {{ detail.importStatusLabel ?? '未知' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="总记录数">{{
              detail.totalCount ?? 0
            }}</el-descriptions-item>
            <el-descriptions-item label="成功 / 失败">
              {{ detail.successCount ?? 0 }} / {{ detail.failCount ?? 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">{{
              detail.startedAt ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{
              detail.completedAt ?? '-'
            }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <GradeImportFailDetail :items="detail.failDetails" />
      </template>
      <el-empty v-else description="暂无详情数据" :image-size="72" />
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.grade-import {
  &__detail {
    &-summary {
      margin-bottom: $spacing-lg;
    }
  }
}
</style>
