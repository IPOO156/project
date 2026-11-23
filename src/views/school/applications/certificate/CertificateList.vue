<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import ApplicationExtendedFields from '@/components/ui/ApplicationExtendedFields.vue'
import ApplicationFormLayout from '@/components/ui/ApplicationFormLayout.vue'
import ApplicationFormRecord from '@/components/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/components/ui/CorrectionDialog.vue'
import ProofUpload from '@/components/ui/ProofUpload.vue'
import RecordDetailDialog from '@/components/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/components/ui/ScoreIndicatorDialog.vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { CERTIFICATE_TYPES, ROLE_OPTIONS } from '@/shared/constants/dict'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 证书类型：后端字典 certificate_type 优先，常量兜底 */
const { options: certTypeOptions, load: loadCertTypes } = useRemoteDict(
  'certificate_type',
  CERTIFICATE_TYPES,
)

function emptyForm() {
  return {
    certType: '',
    certName: '',
    certDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'certType', label: '证书类型' },
  { key: 'certName', label: '证书名称' },
  { key: 'certDate', label: '获得时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage('certificate', '荣誉证书', emptyForm, undefined, [...REQUIRED_FIELDS]),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'certType', label: '类型', options: certTypeOptions },
  { key: 'certName', label: '证书名称' },
  { key: 'certDate', label: '获得时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '证书类型、名称按证书原文填写。',
  '获得时间按证书落款日期选择。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '五项必填有缺项，提交时会提示「请填写必填项」。',
  '获得时间与所选学期不匹配。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

function handleEditClick(row: any) {
  page.form.certName = row.certName || ''
  page.form.certType = row.certType || ''
  page.form.certDate = row.certDate || ''
  page.form.semester = row.semester || ''
  page.handleEditClick(row)
}

async function handleRemove(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？删除后不可恢复。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await page.removeRecord(row.id)
    ElMessage.success('已删除')
  } catch {
    /* cancel */
  }
}

onMounted(() => {
  page.init()
  loadSemesters()
  void loadCertTypes()
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="荣誉证书申报说明"
    alert-description="请填写获得的荣誉证书信息，并上传证书扫描件等佐证材料。"
    :show-records="true"
    :records="page.records"
    :submitting="page.submitting"
    :is-editing="page.isEditing"
    :status="page.currentStatus"
    :rejection-reason="page.rejectionReason"
    :enrollment-info="page.enrollmentInfo"
    @save-draft="page.handleSaveDraft"
    @submit="page.handleSubmit"
    @view="(row: FormRecord) => page.viewRecord(row)"
    @edit="(row: FormRecord) => handleEditClick(row)"
    @remove="(row: FormRecord) => handleRemove(row)"
    @cancel="page.handleCancel"
    @withdraw="(row: FormRecord) => page.handleWithdraw(row)"
    @correction="(row: FormRecord) => page.handleCorrection(row)"
    @score="(row: FormRecord) => page.handleViewScore(row)"
  >
    <template #form>
      <ApplicationFormLayout
        :required-fields="REQUIRED_FIELDS"
        :form="page.form"
        :preview-fields="PREVIEW_FIELDS"
        :extended-form="page.extendedForm"
        :guide-items="GUIDE_ITEMS"
        :reject-items="REJECT_ITEMS"
      >
        <el-form :model="page.form" label-width="120px">
          <el-form-item label="证书类型" required>
            <el-select
              v-model="page.form.certType"
              placeholder="选择证书类型（如 技能证书）"
              class="form-select"
            >
              <el-option
                v-for="t in certTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="证书名称" required
            ><el-input
              v-model="page.form.certName"
              placeholder="例：全国计算机等级考试二级（Java）"
          /></el-form-item>
          <el-form-item label="获得时间" required
            ><el-date-picker v-model="page.form.certDate" type="month" placeholder="例：2025-06"
          /></el-form-item>
          <el-form-item label="学期" required>
            <el-select
              v-model="page.form.semester"
              placeholder="选择学期（如 2025-2026-1）"
              class="form-select"
            >
              <el-option
                v-for="s in semesterOptions"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
          <ApplicationExtendedFields
            :form="page.extendedForm"
            :hidden="['role', 'acquisitionDate']"
            @update="
              (field: string, val: string) => {
                ;(page.extendedForm as Record<string, string>)[field] = val
              }
            "
          />
          <el-form-item label="佐证材料" required>
            <ProofUpload
              v-model:file-list="page.form.proofMaterials"
              :status="page.currentStatus"
            />
          </el-form-item>
        </el-form>
      </ApplicationFormLayout>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="submitDate" label="提交日期" width="120" />
    </template>
  </ApplicationFormRecord>

  <CorrectionDialog
    :visible="page.correctionVisible"
    :submitting="page.correctionSubmitting"
    :original-record="page.originalSnapshot"
    :form="page.correctionForm"
    @update:visible="
      (v: boolean) => {
        if (!v) page.closeCorrection()
      }
    "
    @update:form="(field: string, val: string) => page.setChangedField(field, val)"
    @remove-field="page.removeChangedField"
    @submit="page.submitCorrection"
  />
  <ScoreIndicatorDialog
    :visible="page.indicatorVisible"
    :loading="page.indicatorLoading"
    :title="page.indicatorTitle"
    :indicators="page.indicators"
    @close="page.closeIndicator"
  />
  <RecordDetailDialog
    :visible="page.detailVisible"
    :record="page.detailRecord"
    :loading="page.detailLoading"
    @update:visible="
      (v) => {
        if (!v) page.closeDetail()
      }
    "
    @close="page.closeDetail"
  />
</template>

<style scoped lang="scss">
.form-select {
  width: 200px;
}
:deep(.page-container) {
  user-select: none;
}
</style>
