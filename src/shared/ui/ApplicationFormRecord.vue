<script setup lang="ts" generic="T">
import ApplicationRecordTable from './ApplicationRecordTable.vue'
import RejectionBanner from './RejectionBanner.vue'
import StatusTag from './StatusTag.vue'
import StudentInfoBar from './StudentInfoBar.vue'

interface Props {
  alertTitle: string
  alertDescription: string
  isEditing?: boolean
  submitting?: boolean
  records?: T[]
  showAlert?: boolean
  showRecords?: boolean
  status?: string
  rejectionReason?: string
  enrollmentInfo?: Record<string, any>
  submitText?: string
}

withDefaults(defineProps<Props>(), {
  records: () => [],
  showAlert: true,
  showRecords: true,
  status: '',
  rejectionReason: '',
  enrollmentInfo: undefined,
  submitText: '提交报名',
})

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'cancel'): void
  (e: 'saveDraft'): void
  (e: 'view', row: T): void
  (e: 'edit', row: T): void
  (e: 'remove', row: T): void
  (e: 'withdraw', row: T): void
  (e: 'correction', row: T): void
  (e: 'score', row: T): void
}>()

function canEdit(s: string) {
  return s === 'draft' || !s || s === 'rejected'
}
</script>

<template>
  <div class="app-page">
    <!-- 常驻渲染：数据到达后原地替换占位短横线，避免异步插入把下方内容整体下推 -->
    <StudentInfoBar v-bind="enrollmentInfo ?? {}" />
    <RejectionBanner
      v-if="rejectionReason && (status === 'rejected' || status === 'pending')"
      :reason="rejectionReason"
    />
    <el-alert v-if="showAlert" :title="alertTitle" type="info" :closable="false" show-icon>
      <p>{{ alertDescription }}</p>
      <div v-if="status" class="app-page__status-bar">
        当前状态：<StatusTag :status="status" size="small" />
      </div>
    </el-alert>

    <el-card class="form-card">
      <template #header
        ><span class="card-title">{{ isEditing ? '编辑申报信息' : '填写申报信息' }}</span></template
      >

      <slot name="form" />

      <div class="form-actions">
        <el-button v-if="canEdit(status)" @click="emit('saveDraft')">保存草稿</el-button>
        <el-button v-if="isEditing && canEdit(status)" @click="emit('cancel')">取消</el-button>
        <el-button
          v-if="canEdit(status)"
          type="primary"
          :loading="submitting"
          @click="emit('submit')"
          >{{ isEditing ? '保存修改' : submitText }}</el-button
        >
        <el-tag v-if="status === 'approved' || status === 'withdrawn'" type="info" effect="plain"
          >当前记录仅可查看</el-tag
        >
      </div>
    </el-card>

    <ApplicationRecordTable
      :records="records"
      :show-records="showRecords"
      :status="status"
      @view="emit('view', $event as T)"
      @edit="emit('edit', $event as T)"
      @remove="emit('remove', $event as T)"
      @withdraw="emit('withdraw', $event as T)"
      @correction="emit('correction', $event as T)"
      @score="emit('score', $event as T)"
    >
      <template #columns><slot name="columns" /></template>
    </ApplicationRecordTable>
  </div>
</template>

<style scoped lang="scss">
.app-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  :deep(.el-alert__description) p {
    margin: 4px 0 0;
    font-size: 13px;
  }
  &__status-bar {
    margin-top: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
.card-title {
  font-weight: 600;
}
.form-card :deep(.el-form) .el-input,
.form-card :deep(.el-form) .el-select,
.form-card :deep(.el-form) .el-date-editor,
.form-card :deep(.el-form) .el-textarea {
  width: 480px;
  max-width: 100%;
}
.form-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  /* 与佐证材料上传区左缘（标签宽 120px）对齐，两个操作按钮靠左排布 */
  padding-left: 120px;

  :deep(.el-button) {
    min-width: 96px;
  }
}
@media (max-width: 768px) {
  /* 控件改为 100% 后按钮跟随表单左缘 */
  .form-actions {
    padding-left: 0;
  }
  .form-card :deep(.el-form) .el-input,
  .form-card :deep(.el-form) .el-select,
  .form-card :deep(.el-form) .el-date-editor,
  .form-card :deep(.el-form) .el-textarea {
    width: 100%;
  }
}
</style>
