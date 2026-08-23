<script setup lang="ts" generic="T">
import type { ApplicationType } from '@/shared/types/types'
import { ref } from 'vue'
import { getApplicationVersions } from '@/shared/api/applications'
import { getAwardVersions } from '@/shared/api/awards'
import { activityCategoryOf } from '@/shared/api/submission'
import { useDict } from '@/shared/composables/composables'
import { APPLICATION_STATUS } from '@/shared/constants/dict'
import RejectionBanner from './RejectionBanner.vue'
import StatusTag from './StatusTag.vue'
import StudentInfoBar from './StudentInfoBar.vue'
import VersionHistoryDrawer from './VersionHistoryDrawer.vue'

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

const props = withDefaults(defineProps<Props>(), {
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

const _u_getLabel = useDict(APPLICATION_STATUS)

function getRecordStatus(record: any): string {
  return record.status || props.status || 'draft'
}
function canEdit(s: string) {
  return s === 'draft' || !s || s === 'rejected'
}
function canDelete(s: string) {
  return s === 'draft' || !s
}
function canWithdraw(s: string) {
  return s === 'pending'
}
function canRequestCorrection(s: string) {
  return s === 'approved'
}
function canViewScore(s: string) {
  return s === 'pending' || s === 'approved' || s === 'withdrawn'
}

interface VersionItem {
  version: number
  title: string
  status: number
  statusLabel: string
  rejectedReason?: string
  createdAt: string
}

const versionsVisible = ref(false)
const versionsLoading = ref(false)
const versionsData = ref<{ currentVersion: number; versions: VersionItem[] }>({
  currentVersion: 0,
  versions: [],
})

/** 版本历史入口仅对真实记录开放（本地草稿 draft-local / 临时 rec- 无后端版本记录） */
function canViewVersions(row: any): boolean {
  const id = row?.id
  return id !== undefined && id !== null && /^\d+$/.test(String(id))
}
async function openVersions(row: any) {
  const id = Number(row.id)
  if (!id) return
  versionsVisible.value = true
  versionsLoading.value = true
  versionsData.value = { currentVersion: 0, versions: [] }
  try {
    const category = activityCategoryOf(row.type as ApplicationType)
    versionsData.value =
      category === 'award' ? await getAwardVersions(id) : await getApplicationVersions(id)
  } catch {
    // 版本历史拉取失败：接口 30001 返回 HTTP 404，已由 request 拦截器静默，此处展示空态
  } finally {
    versionsLoading.value = false
  }
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

    <el-card v-if="showRecords && records.length" class="record-card">
      <template #header
        ><span class="card-title">申报记录</span
        ><span class="card-title__count">共 {{ records.length }} 条</span></template
      >
      <el-table :data="records as any" stripe>
        <slot name="columns" />
        <el-table-column label="状态" width="100" align="center"
          ><template #default="{ row }"
            ><StatusTag :status="getRecordStatus(row)" size="small" /></template
        ></el-table-column>
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="emit('view', row as T)"
              >查看</el-button
            >
            <el-button
              v-if="canEdit(getRecordStatus(row))"
              size="small"
              type="primary"
              link
              @click="emit('edit', row as T)"
              >编辑</el-button
            >
            <el-button
              v-if="canDelete(getRecordStatus(row))"
              size="small"
              type="danger"
              link
              @click="emit('remove', row as T)"
              >删除</el-button
            >
            <el-button
              v-if="canWithdraw(getRecordStatus(row))"
              size="small"
              type="warning"
              link
              @click="emit('withdraw', row as T)"
              >撤回</el-button
            >
            <el-button
              v-if="canRequestCorrection(getRecordStatus(row))"
              size="small"
              type="primary"
              link
              @click="emit('correction', row as T)"
              >申请更正</el-button
            >
            <el-button
              v-if="canViewScore(getRecordStatus(row))"
              size="small"
              type="info"
              link
              @click="emit('score', row as T)"
              >计分影响</el-button
            >
            <el-button
              v-if="canViewVersions(row)"
              size="small"
              type="info"
              link
              @click="openVersions(row as T)"
              >版本</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <VersionHistoryDrawer
      v-model:visible="versionsVisible"
      :loading="versionsLoading"
      :current-version="versionsData.currentVersion"
      :versions="versionsData.versions"
    />
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
.card-title__count {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 400;
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
