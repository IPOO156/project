<script setup lang="ts">
/**
 * 职业规划详情头部：标题、状态、下载/预览操作、学期来源、完成进度与审核信息。
 */
import type { TagProps } from 'element-plus'

defineProps<{
  /** /profile/career-plans/{id} 返回的详情对象 */
  detail: any
  /** 状态标签配色（父级按字典映射） */
  statusType: TagProps['type']
  /** 状态文案 */
  statusLabel: string
  /** 文件下载/预览请求中 */
  fileLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'download'): void
  (e: 'preview'): void
}>()
</script>

<template>
  <div class="plan-detail__head">
    <div class="head-title-row">
      <h2 class="head-title">{{ detail.title }}</h2>
      <el-tag :type="statusType" size="small">{{ statusLabel }}</el-tag>
    </div>
    <div class="head-actions">
      <el-button size="small" :loading="fileLoading" @click="emit('download')">下载</el-button>
      <el-button size="small" type="primary" plain :loading="fileLoading" @click="emit('preview')">
        预览
      </el-button>
    </div>
    <div class="head-meta">
      <span class="meta-item">{{ detail.semesterName || '-' }}</span>
      <span v-if="detail.sourceLabel" class="meta-item">来源：{{ detail.sourceLabel }}</span>
    </div>
    <el-progress :percentage="detail.progressRate ?? 0" :stroke-width="8" class="head-progress" />
    <div v-if="detail.auditorName" class="head-audit">审核人：{{ detail.auditorName }}</div>
    <div v-if="detail.rejectedReason" class="head-reject">
      退回原因：{{ detail.rejectedReason }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.plan-detail__head {
  padding: 8px 4px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.head-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.head-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.meta-item {
  color: var(--el-text-color-regular);
}

.head-progress {
  margin-top: 2px;
}

.head-audit {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.head-reject {
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  padding: 8px 12px;
}
</style>
