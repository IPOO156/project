<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { ROLE_OPTIONS, SCHOLARSHIP_GRADES, SCHOLARSHIP_LEVELS } from '@/shared/constants/dict'
import ApplicationExtendedFields from '@/shared/ui/ApplicationExtendedFields.vue'
import ApplicationFormLayout from '@/shared/ui/ApplicationFormLayout.vue'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import RecordDetailDialog from '@/shared/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'
import { asText } from '@/shared/utils/unknown'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 获奖等级：后端字典优先，常量兜底 */
const { options: scholarshipGradeOptions, load: loadScholarshipGrades } = useRemoteDict(
  'scholarship_award_level',
  SCHOLARSHIP_GRADES,
)

/** 奖学金级别：后端字典优先，常量兜底 */
const { options: scholarshipLevelOptions, load: loadScholarshipLevels } = useRemoteDict(
  'scholarship_level',
  SCHOLARSHIP_LEVELS,
)

function emptyForm() {
  return {
    awardName: '',
    scholarshipLevel: '',
    scholarshipGrade: '',
    acquireDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'awardName', label: '奖项名称' },
  { key: 'scholarshipLevel', label: '奖学金级别' },
  { key: 'scholarshipGrade', label: '获奖等级' },
  { key: 'acquireDate', label: '获得时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage('scholarship', '奖学金', emptyForm, undefined, [...REQUIRED_FIELDS]),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'awardName', label: '奖项' },
  { key: 'scholarshipLevel', label: '级别', options: scholarshipLevelOptions },
  { key: 'scholarshipGrade', label: '等级', options: scholarshipGradeOptions },
  { key: 'acquireDate', label: '获得时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '奖项名称按证书或公示文件全称填写。',
  '奖学金级别、获奖等级以证书落款为准。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '六项必填有缺项，提交时会提示「请填写必填项」。',
  '获得时间与所选学期不匹配。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

function handleEditClick(row: Record<string, unknown>) {
  page.form.awardName = asText(row.awardName)
  page.form.scholarshipLevel = asText(row.scholarshipLevel)
  page.form.scholarshipGrade = asText(row.scholarshipGrade)
  page.form.acquireDate = asText(row.acquireDate)
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
  void loadScholarshipGrades()
  void loadScholarshipLevels()
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="奖学金申报说明"
    alert-description="请填写奖学金获奖信息，并上传奖学金证书或公示文件等佐证材料。"
    :show-records="true"
    :records="page.records"
    :submitting="page.submitting"
    :saving="page.draftSaving"
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
          <el-form-item label="奖项名称" required
            ><el-input v-model="page.form.awardName" placeholder="例：2024-2025 学年国家奖学金"
          /></el-form-item>
          <el-form-item label="奖学金级别" required>
            <el-select
              v-model="page.form.scholarshipLevel"
              placeholder="选择奖学金级别（如 国家奖学金）"
              class="form-select"
            >
              <el-option
                v-for="t in scholarshipLevelOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="获奖等级" required>
            <el-select
              v-model="page.form.scholarshipGrade"
              placeholder="选择获奖等级（如 一等奖）"
              class="form-select"
            >
              <el-option
                v-for="t in scholarshipGradeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="获得时间" required
            ><el-date-picker v-model="page.form.acquireDate" type="month" placeholder="例：2025-06"
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
            :hidden="[
              'role',
              'certNumber',
              'issuingAuthority',
              'acquisitionDate',
              'validityPeriod',
            ]"
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
