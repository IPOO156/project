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
import { useSemesters } from '@/shared/composables/useSemesters'
import { ROLE_OPTIONS } from '@/shared/constants/dict'
import { asText } from '@/shared/utils/unknown'

const { semesterOptions, load: loadSemesters } = useSemesters()

function emptyForm() {
  return {
    softName: '',
    ranking: '',
    approveDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'softName', label: '软著名称' },
  { key: 'ranking', label: '排名/总人数' },
  { key: 'approveDate', label: '获批时间' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '证明材料' },
] as const

const page = reactive(
  useApplicationPage(
    'softwareCopyright',
    '软件著作权申报',
    emptyForm,
    'software-copyright',
    [...REQUIRED_FIELDS],
    { monthField: 'approveDate', monthFieldLabel: '获批时间' },
  ),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'softName', label: '软著' },
  { key: 'ranking', label: '排名' },
  { key: 'approveDate', label: '获批时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '先选学期再填获批时间；切换学期会清空与新学期的日期。',
  '软著名称按登记证书全称填写。',
  '排名/总人数按证书上的实际排名填写。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '证明材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '五项必填有缺项，提交时会提示「请填写必填项」。',
  '获批时间晚于所选学期的结束日期。',
  '切换学期后获批时间被清空，未重新填写。',
  '证明材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

const staggerActive = useFirstLoadStagger(() => page.records.length)

function handleEditClick(row: Record<string, unknown>) {
  page.form.softName = asText(row.softName)
  page.form.ranking = asText(row.ranking)
  page.form.approveDate = asText(row.approveDate)
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
    class="page-enter"
    :class="{ 'is-stagger-armed': staggerActive }"
    alert-title="软件著作权申报说明"
    alert-description="请填写软件著作权信息，提交后可在下方查看记录。"
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
          <el-form-item label="软著名称" required
            ><el-input v-model="page.form.softName" placeholder="例：学生成长档案管理系统 V1.0"
          /></el-form-item>
          <el-form-item label="排名/总人数" required>
            <el-input
              v-model="page.form.ranking"
              placeholder="例：2/5（本人排第 2）"
              class="form-input"
            />
          </el-form-item>
          <el-form-item label="获批时间" required>
            <el-date-picker
              v-model="page.form.approveDate"
              type="month"
              format="YYYY-MM"
              value-format="YYYY-MM"
              placeholder="例：2025-06"
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
          <el-form-item label="证明材料" required>
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
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
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

.form-select,
.form-input {
  width: 200px;
}
:deep(.page-container) {
  user-select: none;
}
</style>
