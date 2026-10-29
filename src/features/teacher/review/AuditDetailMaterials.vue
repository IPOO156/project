<script setup lang="ts">
import type { AuditEvidenceFile, AuditPendingDetail } from '@/shared/types/teacher'
import { ExternalLink, FileText, ImageIcon } from 'lucide-vue-next'
import { AUDIT_ACTIONS } from '@/shared/constants/dict'
import { formatDateTime } from '@/shared/utils/time'

const props = defineProps<{ detail: AuditPendingDetail }>()

const emit = defineEmits<{
  (e: 'preview', file: AuditEvidenceFile): void
}>()

function formatTime(value: string | null | undefined, withSeconds = false): string {
  return formatDateTime(value, withSeconds)
}

function isImage(name: string | undefined): boolean {
  return /\.(?:jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name ?? '')
}

const actionTag = (action: number) => AUDIT_ACTIONS[action]?.tag ?? 'info'
const actionLabel = (action: number) => AUDIT_ACTIONS[action]?.label ?? String(action)
</script>

<template>
  <!-- 佐证材料 -->
  <div class="audit-detail__section">
    <div class="audit-detail__section-title">佐证材料</div>
    <div v-if="props.detail.evidenceFiles?.length" class="audit-detail__files">
      <div
        v-for="file in props.detail.evidenceFiles"
        :key="file.fileId"
        class="audit-detail__file"
        @click="emit('preview', file)"
      >
        <component
          :is="isImage(file.fileName) ? ImageIcon : FileText"
          :size="22"
          class="audit-detail__file-icon"
        />
        <span class="audit-detail__file-name">{{ file.fileName }}</span>
        <ExternalLink :size="14" class="audit-detail__file-link" />
      </div>
    </div>
    <div v-else class="audit-detail__no-file">暂无佐证材料</div>
  </div>

  <!-- 审批历史 -->
  <div v-if="props.detail.approvalHistory?.length" class="audit-detail__section">
    <div class="audit-detail__section-title">审批历史</div>
    <el-timeline class="audit-detail__timeline">
      <el-timeline-item
        v-for="node in props.detail.approvalHistory"
        :key="node.nodeId"
        :timestamp="formatTime(node.createdAt)"
        placement="top"
      >
        <div class="audit-detail__node">
          <el-tag :type="actionTag(node.action)" size="small" effect="light">
            {{ actionLabel(node.action) }}
          </el-tag>
          <span class="audit-detail__node-step">{{ node.stepName }}</span>
          <span class="audit-detail__node-auditor">{{ node.auditorName }}</span>
        </div>
        <div v-if="node.comment" class="audit-detail__node-comment">{{ node.comment }}</div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<style scoped lang="scss">
.audit-detail {
  &__section {
    margin-top: $spacing-lg;
    &-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $color-text-primary;
      margin-bottom: $spacing-sm;
      padding-left: 8px;
      border-left: 3px solid $color-accent;
    }
  }

  &__files {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }

  &__file {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 220px;
    padding: 6px 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-base;
    cursor: pointer;
    @include transition-ui($duration-base);

    &:hover {
      border-color: $color-accent;
      background: $color-primary-lightest;
    }

    &-icon {
      flex-shrink: 0;
      color: $color-primary-lighter;
    }

    &-name {
      font-size: 13px;
      color: $color-text-primary;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-link {
      flex-shrink: 0;
      color: var(--el-text-color-secondary);
    }
  }

  &__no-file {
    padding: $spacing-lg;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: $font-size-base;
    background: var(--el-fill-color-light);
    border-radius: $radius-base;
  }

  &__node {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    &-step {
      font-weight: 600;
      color: $color-text-primary;
      font-size: 13px;
    }

    &-auditor {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }

  &__node-comment {
    margin-top: 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}
</style>
