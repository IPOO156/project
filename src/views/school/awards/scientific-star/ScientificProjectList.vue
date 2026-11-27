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
import { useFirstLoadStagger } from '@/shared/composables/useFirstLoadStagger'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { PROJECT_LEVELS, ROLE_OPTIONS } from '@/shared/constants/dict'
import { asText } from '@/shared/utils/unknown'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 项目级别：后端字典优先，常量兜底 */
const { options: projectLevelOptions, load: loadProjectLevels } = useRemoteDict(
  'project_level',
  PROJECT_LEVELS,
)

function emptyForm() {
  return {
    projectName: '',
    projectLevel: '',
    ranking: '',
    startDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'projectName', label: '项目名称' },
  { key: 'projectLevel', label: '项目级别' },
  { key: 'ranking', label: '排名/总人数' },
  { key: 'startDate', label: '立项时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage(
    'scientificProject',
    '科研项目',
    emptyForm,
    'scientific-project',
    [...REQUIRED_FIELDS],
    { monthField: 'startDate', monthFieldLabel: '立项时间', endDateOnly: true },
  ),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'projectName', label: '项目' },
  { key: 'projectLevel', label: '级别', options: projectLevelOptions },
  { key: 'ranking', label: '排名' },
  { key: 'startDate', label: '立项时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '先选学期再填立项时间；立项时间不得晚于学期结束日期。',
  '项目名称、级别按立项文件或证书填写。',
  '排名/总人数按证书上的实际排名填写。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '六项必填有缺项，提交时会提示「请填写必填项」。',
  '立项时间晚于所选学期的结束日期。',
  '切换学期后立项时间被清空，未重新填写。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

const staggerActive = useFirstLoadStagger(() => page.records.length)

function handleEditClick(row: Record<string, unknown>) {
  page.form.projectName = asText(row.projectName)
  page.form.projectLevel = asText(row.projectLevel)
  page.form.ranking = asText(row.ranking)
  page.form.startDate = asText(row.startDate)
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
  void loadProjectLevels()
})
</script>

<template>
  <ApplicationFormRecord
    class="page-enter"
    :class="{ 'is-stagger-armed': staggerActive }"
    alert-title="科研项目申报说明"
    alert-description="请填写科研项目信息。"
    :show-alert="false"
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
          <el-form-item label="项目级别" required>
            <el-select
              v-model="page.form.projectLevel"
              placeholder="选择项目级别（如 国家级）"
              class="form-select"
            >
              <el-option
                v-for="t in projectLevelOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="排名/总人数" required
            ><el-input v-model="page.form.ranking" placeholder="例：2/5（本人排第 2）"
          /></el-form-item>
          <el-form-item label="立项时间" required>
            <el-date-picker
              v-model="page.form.startDate"
              type="month"
              format="YYYY-MM"
              value-format="YYYY-MM"
              placeholder="例：2025-03"
              :disabled-date="page.disabledDate"
            />
          </el-form-item>
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
            :hidden="['acquisitionDate']"
            @update="
              (field: string, val: string) => {
                ;(page.extendedForm as Record<string, string>)[field] = val
              }
            "
          />
          <el-form-item label="佐证材料" required
            ><ProofUpload v-model:file-list="page.form.proofMaterials" :status="page.currentStatus"
          /></el-form-item>
        </el-form>
      </ApplicationFormLayout>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="role" label="本人角色" width="100">
        <template #default="{ row }">{{
          ROLE_OPTIONS.find((r) => r.value === row.role)?.label || '-'
        }}</template>
      </el-table-column>
      <el-table-column prop="submitDate" label="提交日期" width="110" />
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
.page-enter {
  @include page-enter;
}

.page-enter.is-stagger-armed {
  --mc-row-duration: 0.32s;
  --mc-row-delay: 0.04s;
  --mc-row-offset: 60px;
  --mc-row-easing: #{$ease-out-cubic};

  @include table-row-staggered(20);
}

:deep(.page-container) {
  user-select: none;
}
</style>
