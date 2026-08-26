<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, watch } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'
import {
  buildSemesterMonthDisabledDate,
  isMonthInSemester,
  sanitizeSemesterMonthPair,
} from '@/shared/utils/semester'

function emptyForm() {
  return {
    softName: '',
    issuer: '',
    ranking: '',
    approveDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const page = reactive(
  useApplicationPage('softwareCopyright', '软件著作权申报', emptyForm, 'software-copyright', [
    { key: 'softName', label: '软著名称' },
    { key: 'issuer', label: '颁发单位' },
    { key: 'ranking', label: '排名/总人数' },
    { key: 'approveDate', label: '获批时间' },
    { key: 'semester', label: '学期' },
    { key: 'proofMaterials', label: '证明材料' },
  ]),
)

const disabledDate = computed(() => buildSemesterMonthDisabledDate(page.form.semester))

watch(
  () => page.form.semester,
  () => {
    sanitizeSemesterMonthPair(page.form, 'approveDate', 'semester')
  },
)

function handleEditClick(row: any) {
  page.form.softName = row.softName || ''
  page.form.issuer = row.issuer || ''
  page.form.ranking = row.ranking || ''
  page.form.approveDate = row.approveDate || ''
  page.form.semester = row.semester || ''
  page.handleEditClick(row)
}

async function handleSubmit() {
  sanitizeSemesterMonthPair(page.form, 'approveDate', 'semester')
  if (!isMonthInSemester(page.form.approveDate, page.form.semester)) {
    ElMessage.error('获批时间与学期不匹配，请重新选择')
    return
  }
  return page.handleSubmit()
}

async function handleRemove(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？删除后不可恢复。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    page.removeRecord(row.id)
    ElMessage.success('已删除')
  } catch {
    /* cancel */
  }
}

onMounted(() => {
  page.init()
})
</script>

<template>
  <ApplicationFormRecord
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
    :show-extended-fields="true"
    :extended-form="page.extendedForm"
    @update:extended-form="
      (field, val) => {
        ;(page.extendedForm as any)[field] = val
      }
    "
    @save-draft="page.handleSaveDraft"
    @submit="handleSubmit"
    @view="(row) => page.viewRecord(row)"
    @edit="(row) => handleEditClick(row)"
    @remove="(row) => handleRemove(row)"
    @cancel="page.handleCancel"
    @withdraw="(row) => page.handleWithdraw(row)"
    @correction="(row) => page.handleCorrection(row)"
    @score="(row) => page.handleViewScore(row)"
  >
    <template #form>
      <el-form :model="page.form" label-width="120px">
        <el-form-item label="软著名称" required
          ><el-input v-model="page.form.softName"
        /></el-form-item>
        <el-form-item label="颁发单位" required
          ><el-input v-model="page.form.issuer"
        /></el-form-item>
        <el-form-item label="排名/总人数" required>
          <el-input v-model="page.form.ranking" placeholder="如：1/4" class="form-input" />
        </el-form-item>
        <el-form-item label="获批时间" required>
          <el-date-picker
            v-model="page.form.approveDate"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            :disabled-date="disabledDate"
          />
        </el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="page.form.semester" placeholder="请选择" class="form-select">
            <el-option
              v-for="s in SEMESTER_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料" required>
          <ProofUpload v-model:file-list="page.form.proofMaterials" :status="page.currentStatus" />
        </el-form-item>
      </el-form>
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
      (v) => {
        if (!v) page.closeCorrection()
      }
    "
    @update:form="(field, val) => page.setChangedField(field, val)"
    @submit="page.submitCorrection"
  />
  <ScoreIndicatorDialog
    :visible="page.indicatorVisible"
    :loading="page.indicatorLoading"
    :title="page.indicatorTitle"
    :indicators="page.indicators"
    @close="page.closeIndicator"
  />
</template>

<style scoped lang="scss">
.form-select,
.form-input {
  width: 200px;
}
:deep(.page-container) {
  user-select: none;
}
</style>
