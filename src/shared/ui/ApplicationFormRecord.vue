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
  showExtendedFields?: boolean
  extendedForm?: {
    role?: string
    certNumber?: string
    issuingAuthority?: string
    acquisitionDate?: string
    validityPeriod?: string
  }
  submitText?: string
}

withDefaults(defineProps<Props>(), {
  records: () => [],
  showAlert: true,
  showRecords: true,
  status: '',
  rejectionReason: '',
  enrollmentInfo: undefined,
  showExtendedFields: false,
  extendedForm: undefined,
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
  (e: 'update:extendedForm', field: string, value: any): void
}>()

function canEdit(s: string) {
  return s === 'draft' || !s || s === 'rejected'
}
</script>

<template>
  <div class="app-page">
    <StudentInfoBar v-if="enrollmentInfo" v-bind="enrollmentInfo" />
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

      <div v-if="showExtendedFields && extendedForm" class="extended-fields">
        <div class="extended-fields__title">扩展信息</div>
        <el-row :gutter="16">
          <el-col :span="12"
            ><el-form-item label="本人角色"
              ><el-select
                :model-value="extendedForm.role"
                placeholder="请选择"
                @update:model-value="emit('update:extendedForm', 'role', $event)"
                ><el-option label="负责人" value="leader" /><el-option
                  label="成员"
                  value="member" /><el-option
                  label="独立完成"
                  value="individual" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="证书编号"
              ><el-input
                :model-value="extendedForm.certNumber"
                placeholder="请输入证书编号"
                @update:model-value="
                  emit('update:extendedForm', 'certNumber', $event)
                " /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="发证单位"
              ><el-input
                :model-value="extendedForm.issuingAuthority"
                placeholder="请输入发证单位"
                @update:model-value="
                  emit('update:extendedForm', 'issuingAuthority', $event)
                " /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="取得时间"
              ><el-date-picker
                :model-value="extendedForm.acquisitionDate"
                type="month"
                placeholder="选择年月"
                value-format="YYYY-MM"
                @update:model-value="
                  emit('update:extendedForm', 'acquisitionDate', $event)
                " /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="有效期"
              ><el-date-picker
                :model-value="extendedForm.validityPeriod"
                type="month"
                placeholder="选择年月"
                value-format="YYYY-MM"
                @update:model-value="
                  emit('update:extendedForm', 'validityPeriod', $event)
                " /></el-form-item
          ></el-col>
        </el-row>
      </div>

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
.extended-fields {
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-color-primary);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-light);
  }
  :deep(.el-select),
  :deep(.el-input),
  :deep(.el-date-editor) {
    width: 100%;
  }
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 768px) {
  .extended-fields :deep(.el-col) {
    width: 100%;
  }
  .form-card :deep(.el-form) .el-input,
  .form-card :deep(.el-form) .el-select,
  .form-card :deep(.el-form) .el-date-editor,
  .form-card :deep(.el-form) .el-textarea {
    width: 100%;
  }
}
</style>
