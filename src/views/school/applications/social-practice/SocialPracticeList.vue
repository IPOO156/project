<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import AddressPicker from '@/components/ui/AddressPicker.vue'
import ApplicationExtendedFields from '@/components/ui/ApplicationExtendedFields.vue'
import ApplicationFormLayout from '@/components/ui/ApplicationFormLayout.vue'
import ApplicationFormRecord from '@/components/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/components/ui/CorrectionDialog.vue'
import ProofUpload from '@/components/ui/ProofUpload.vue'
import RecordDetailDialog from '@/components/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/components/ui/ScoreIndicatorDialog.vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useSemesters } from '@/shared/composables/useSemesters'
import { ROLE_OPTIONS } from '@/shared/constants/dict'
import { asNumber, asText } from '@/shared/utils/unknown'

const { semesterOptions, load: loadSemesters } = useSemesters()

function emptyForm() {
  return {
    activityName: '',
    location: '',
    organization: '',
    startDate: '',
    endDate: '',
    volunteerHours: 0,
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'activityName', label: '活动名称' },
  { key: 'location', label: '活动地点' },
  { key: 'organization', label: '组织单位' },
  { key: 'startDate', label: '开始时间' },
  { key: 'endDate', label: '结束时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage('socialPractice', '社会实践', emptyForm, 'social-practice', [
    ...REQUIRED_FIELDS,
  ]),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'activityName', label: '活动名称' },
  { key: 'location', label: '活动地点' },
  { key: 'organization', label: '组织单位' },
  { key: 'startDate', label: '开始时间' },
  { key: 'endDate', label: '结束时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '活动地点支持逐级选择，也可粘贴完整地址用 AI 识别。',
  '起止时间按实践证明填写，结束时间不能早于开始时间。',
  '志愿时长按实际服务时长填写。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '七项必填有缺项，提交时会提示「请填写必填项」。',
  '开始/结束时间与所选学期不匹配。',
  '结束时间早于开始时间。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

function handleEditClick(row: Record<string, unknown>) {
  page.form.activityName = asText(row.activityName)
  page.form.location = asText(row.location)
  page.form.organization = asText(row.organization)
  page.form.startDate = asText(row.startDate)
  page.form.endDate = asText(row.endDate)
  page.form.volunteerHours = asNumber(row.volunteerHours)
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
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="社会实践申报说明"
    alert-description="请填写社会实践活动信息，并上传实践证明等佐证材料。"
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
          <el-form-item label="活动名称" required
            ><el-input
              v-model="page.form.activityName"
              placeholder="例：2025 年暑期「三下乡」社会实践"
          /></el-form-item>
          <el-form-item label="活动地点" required>
            <AddressPicker v-model="page.form.location" />
          </el-form-item>
          <el-form-item label="组织单位" required
            ><el-input v-model="page.form.organization" placeholder="例：校团委青年志愿者协会"
          /></el-form-item>
          <el-form-item label="开始时间" required
            ><el-date-picker v-model="page.form.startDate" type="date" placeholder="例：2025-07-05"
          /></el-form-item>
          <el-form-item label="结束时间" required
            ><el-date-picker v-model="page.form.endDate" type="date" placeholder="例：2025-07-20"
          /></el-form-item>
          <el-form-item label="志愿时长">
            <el-input-number
              v-model="page.form.volunteerHours"
              :min="0"
              controls-position="right"
              class="form-input-number"
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
.form-input-number {
  width: 200px;
}
:deep(.page-container) {
  user-select: none;
}
</style>
