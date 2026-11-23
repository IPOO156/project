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
import { useSemesters } from '@/shared/composables/useSemesters'
import { ROLE_OPTIONS } from '@/shared/constants/dict'

const { semesterOptions, load: loadSemesters } = useSemesters()

function emptyForm() {
  return {
    bookName: '',
    bookDate: '',
    review: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'bookName', label: '图书名称' },
  { key: 'bookDate', label: '阅读时间' },
  { key: 'review', label: '心得体会' },
  { key: 'semester', label: '学期' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage('bookReport', '图书心得', emptyForm, 'book-report', [...REQUIRED_FIELDS]),
)

/** 实时预览字段：心得体会较长，不放进预览 */
const PREVIEW_FIELDS = [
  { key: 'bookName', label: '图书' },
  { key: 'bookDate', label: '阅读时间' },
  { key: 'semester', label: '学期' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '图书名称按封面全称填写。',
  '阅读时间按实际阅读月份选择。',
  '心得体会建议不少于 300 字，便于审核。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '五项必填有缺项，提交时会提示「请填写必填项」。',
  '阅读时间与所选学期不匹配。',
  '心得体会内容过短或与图书无关。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
]

function handleEditClick(row: any) {
  page.form.bookName = row.bookName || ''
  page.form.bookDate = row.bookDate || ''
  page.form.review = row.review || ''
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
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="图书心得申报说明"
    alert-description="请填写阅读图书的心得体会，并上传心得文档等佐证材料。"
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
          <el-form-item label="图书名称" required
            ><el-input v-model="page.form.bookName" placeholder="例：《乡土中国》"
          /></el-form-item>
          <el-form-item label="阅读时间" required
            ><el-date-picker v-model="page.form.bookDate" type="month" placeholder="例：2025-05"
          /></el-form-item>
          <el-form-item label="心得体会" required>
            <el-input
              v-model="page.form.review"
              type="textarea"
              :rows="4"
              placeholder="例：从「差序格局」理解熟人社会的运行逻辑，约 300 字"
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
