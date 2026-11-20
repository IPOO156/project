<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { AWARD_LEVELS, COMPETITION_TYPES, ROLE_OPTIONS } from '@/shared/constants/dict'
import ApplicationExtendedFields from '@/shared/ui/ApplicationExtendedFields.vue'
import ApplicationFormLayout from '@/shared/ui/ApplicationFormLayout.vue'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import RecordDetailDialog from '@/shared/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 竞赛类型 / 获奖等级：后端字典优先，常量兜底 */
const { options: competitionTypeOptions, load: loadCompetitionTypes } = useRemoteDict(
  'competition_type',
  COMPETITION_TYPES,
)
const { options: awardLevelOptions, load: loadAwardLevels } = useRemoteDict(
  'award_level',
  AWARD_LEVELS,
)

function emptyForm() {
  return {
    competitionName: '',
    competitionType: '',
    awardLevel: '',
    awardDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与模板 required、提交校验共用同一份清单，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'competitionName', label: '竞赛名称' },
  { key: 'competitionType', label: '竞赛类型' },
  { key: 'awardLevel', label: '获奖等级' },
  { key: 'awardDate', label: '获奖时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage(
    'competition',
    '学科竞赛',
    emptyForm,
    undefined,
    // 必填项与模板 el-form-item required 一致；空值提交会被后端 NOT NULL 约束拦截成 409，需在本地校验
    [...REQUIRED_FIELDS],
    // 获奖时间必须落在所选学期内：禁用非学期月份，切换学期时清理越界值，提交前再校验一次
    { monthField: 'awardDate', monthFieldLabel: '获奖时间' },
  ),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'competitionName', label: '竞赛' },
  { key: 'competitionType', label: '类型', options: competitionTypeOptions },
  { key: 'awardLevel', label: '获奖', options: awardLevelOptions },
  { key: 'awardDate', label: '获奖时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '先选学期再填获奖时间；切换学期会清空与新学期的日期。',
  '竞赛名称按获奖证书全称填写，竞赛类型、获奖等级以证书为准。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '六项必填有缺项，提交时会提示「请填写必填项」。',
  '获奖时间与所选学期不匹配。',
  '切换学期后获奖时间被清空，未重新填写。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

function handleEditClick(row: any) {
  page.form.competitionName = row.competitionName || ''
  page.form.competitionType = row.competitionType || ''
  page.form.awardLevel = row.awardLevel || ''
  page.form.awardDate = row.awardDate || ''
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
  void loadCompetitionTypes()
  void loadAwardLevels()
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="学科竞赛申报说明"
    alert-description="请如实填写参与的学科竞赛信息，并上传相关佐证材料（获奖证书扫描件等）。材料经审核通过后将记入个人档案，作为评奖评优依据。"
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
          <el-form-item label="竞赛名称" required
            ><el-input
              v-model="page.form.competitionName"
              placeholder="例：2025 年全国大学生数学建模竞赛"
          /></el-form-item>
          <el-form-item label="竞赛类型" required>
            <el-select
              v-model="page.form.competitionType"
              placeholder="选择竞赛类型（如 学科类）"
              class="form-select"
            >
              <el-option
                v-for="t in competitionTypeOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="获奖等级" required>
            <el-select
              v-model="page.form.awardLevel"
              placeholder="选择获奖等级（如 一等奖）"
              class="form-select"
            >
              <el-option
                v-for="t in awardLevelOptions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="获奖时间" required
            ><el-date-picker
              v-model="page.form.awardDate"
              type="month"
              value-format="YYYY-MM-DD"
              :disabled-date="page.disabledDate"
              placeholder="例：2025-09"
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
            :hidden="['issuingAuthority', 'acquisitionDate', 'validityPeriod']"
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
