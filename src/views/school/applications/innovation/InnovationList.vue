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
import { INDUSTRY_TYPES, INNOVATION_PROJECT_TYPES, ROLE_OPTIONS } from '@/shared/constants/dict'
import { asText } from '@/shared/utils/unknown'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 项目类型：使用后端 project_type 契约码值，不再拉取 company_type 字典 */
/** 项目类型：使用后端 project_type 契约码值，不再拉取 company_type 字典 */
const companyTypeOptions = INNOVATION_PROJECT_TYPES

/** 行业类型：后端字典优先，常量兜底 */
const { options: industryTypeOptions, load: loadIndustryTypes } = useRemoteDict(
  'industry_type',
  INDUSTRY_TYPES,
)

function emptyForm() {
  return {
    companyName: '',
    industryType: '',
    companyType: '',
    registerDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'companyName', label: '公司名称' },
  { key: 'industryType', label: '行业类型' },
  { key: 'companyType', label: '项目类型' },
  { key: 'registerDate', label: '注册时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage('innovation', '创新创业', emptyForm, undefined, [...REQUIRED_FIELDS]),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'companyName', label: '公司' },
  { key: 'industryType', label: '行业', options: industryTypeOptions },
  { key: 'companyType', label: '项目类型', options: companyTypeOptions },
  { key: 'registerDate', label: '注册时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '先选学期再填注册时间；切换学期会清空与新学期的日期。',
  '公司名称按营业执照全称填写。',
  '行业类型、项目类型以实际项目为准。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '六项必填有缺项，提交时会提示「请填写必填项」。',
  '注册时间晚于所选学期的结束日期。',
  '切换学期后注册时间被清空，未重新填写。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

function handleEditClick(row: Record<string, unknown>) {
  page.form.companyName = asText(row.companyName)
  page.form.industryType = asText(row.industryType)
  page.form.companyType = asText(row.companyType)
  page.form.registerDate = asText(row.registerDate)
  page.form.semester = asText(row.semester)
  page.handleEditClick(row)
}

async function handleRemove(row: { id: string }) {
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
  void loadIndustryTypes()
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="创新创业申报说明"
    alert-description="请填写创新创业项目或企业相关信息，并上传营业执照、项目计划书等佐证材料。"
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
          <el-form-item label="公司名称" required
            ><el-input v-model="page.form.companyName" placeholder="例：杭州青禾智能科技有限公司"
          /></el-form-item>
          <el-form-item label="行业类型" required>
            <el-select
              v-model="page.form.industryType"
              placeholder="选择行业类型（如 互联网/信息技术）"
              class="form-select"
            >
              <el-option
                v-for="t in industryTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="项目类型" required>
            <el-select
              v-model="page.form.companyType"
              placeholder="选择项目类型（如 创业实践）"
              class="form-select"
            >
              <el-option
                v-for="t in companyTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="注册时间" required
            ><el-date-picker
              v-model="page.form.registerDate"
              type="date"
              placeholder="例：2025-04-18"
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
            :hidden="['certNumber', 'issuingAuthority', 'acquisitionDate', 'validityPeriod']"
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
              tip="支持 pdf、doc、docx 格式"
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
