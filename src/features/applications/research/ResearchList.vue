<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { PROJECT_LEVELS, RESEARCH_TYPES, ROLE_OPTIONS } from '@/shared/constants/dict'
import ApplicationExtendedFields from '@/shared/ui/ApplicationExtendedFields.vue'
import ApplicationFormLayout from '@/shared/ui/ApplicationFormLayout.vue'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import RecordDetailDialog from '@/shared/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 项目级别 / 研究类型：后端字典优先，常量兜底 */
const { options: projectLevelOptions, load: loadProjectLevels } = useRemoteDict(
  'project_level',
  PROJECT_LEVELS,
)
const { options: researchTypeOptions, load: loadResearchTypes } = useRemoteDict(
  'research_type',
  RESEARCH_TYPES,
)

function emptyForm() {
  return {
    projectName: '',
    projectLevel: '',
    researchType: '',
    projectDate: '',
    endDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'projectName', label: '项目名称' },
  { key: 'projectLevel', label: '项目级别' },
  { key: 'researchType', label: '研究类型' },
  { key: 'projectDate', label: '开始时间' },
  { key: 'endDate', label: '结束时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage('research', '学术研究', emptyForm, undefined, [...REQUIRED_FIELDS]),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'projectName', label: '项目' },
  { key: 'projectLevel', label: '级别', options: projectLevelOptions },
  { key: 'researchType', label: '研究类型', options: researchTypeOptions },
  { key: 'projectDate', label: '开始时间' },
  { key: 'endDate', label: '结束时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '先选学期再填起止时间，结束时间不能早于开始时间。',
  '项目名称、级别、研究类型按立项文件填写。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '七项必填有缺项，提交时会提示「请填写必填项」。',
  '开始/结束时间与所选学期不匹配。',
  '结束时间早于开始时间。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

function handleEditClick(row: any) {
  page.form.projectName = row.projectName || ''
  page.form.projectLevel = row.projectLevel || ''
  page.form.researchType = row.researchType || ''
  page.form.projectDate = row.projectDate || ''
  page.form.endDate = row.endDate || ''
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
  void loadProjectLevels()
  void loadResearchTypes()
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="学术研究申报说明"
    alert-description="请填写参与的学术研究项目信息，并上传项目立项书、结题报告等佐证材料。"
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
          <el-form-item label="项目名称" required
            ><el-input
              v-model="page.form.projectName"
              placeholder="例：基于多模态大模型的学习行为分析"
          /></el-form-item>
          <el-form-item label="项目级别" required
            ><el-select
              v-model="page.form.projectLevel"
              placeholder="选择项目级别（如 国家级）"
              class="form-select"
            >
              <el-option
                v-for="l in projectLevelOptions"
                :key="l.value"
                :label="l.label"
                :value="l.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="研究类型" required
            ><el-select
              v-model="page.form.researchType"
              placeholder="选择研究类型（如 应用研究）"
              class="form-select"
            >
              <el-option
                v-for="t in researchTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间" required
            ><el-date-picker
              v-model="page.form.projectDate"
              type="date"
              placeholder="例：2025-03-01"
          /></el-form-item>
          <el-form-item label="结束时间" required
            ><el-date-picker v-model="page.form.endDate" type="date" placeholder="例：2026-03-01"
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
