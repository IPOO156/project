<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, watch } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { INDUSTRY_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import DuplicateCheckDialog from '@/shared/ui/DuplicateCheckDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'
import {
  buildSemesterMonthDisabledDate,
  isMonthInSemester,
  sanitizeSemesterMonthPair,
} from '@/shared/utils/semester'

function emptyForm() {
  return {
    companyName: '',
    semester: '',
    industryType: '',
    ranking: '',
    registerDate: '',
    proofMaterials: [] as string[],
  }
}

const page = reactive(
  useApplicationPage('innovationStar', '双创之星报名', emptyForm, 'innovation-star'),
)

const disabledDate = computed(() => buildSemesterMonthDisabledDate(page.form.semester))

watch(
  () => page.form.semester,
  () => {
    sanitizeSemesterMonthPair(page.form, 'registerDate', 'semester')
  },
)

function handleEditClick(row: any) {
  page.form.companyName = row.companyName || ''
  page.form.industryType = row.industryType || ''
  page.form.ranking = row.ranking || ''
  page.form.registerDate = row.registerDate || ''
  page.form.semester = row.semester || ''
  page.handleEditClick(row)
}

async function handleSubmit() {
  sanitizeSemesterMonthPair(page.form, 'registerDate', 'semester')
  if (!isMonthInSemester(page.form.registerDate, page.form.semester)) {
    ElMessage.error('注册时间与学期不匹配，请重新选择')
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
    alert-title="双创之星报名说明"
    alert-description="双创之星用于评选在创新创业实践中表现突出的同学。请填写公司信息、行业类型、申报人排名及注册时间，提交后可在下方查看报名记录。"
    :show-records="true"
    :records="page.records"
    :submitting="page.submitting"
    :is-editing="page.isEditing"
    :status="page.currentStatus"
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
        <el-form-item label="公司名称" required
          ><el-input v-model="page.form.companyName"
        /></el-form-item>
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
        <el-form-item label="行业类型" required>
          <el-select v-model="page.form.industryType" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in INDUSTRY_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申报人排名" required>
          <el-input v-model="page.form.ranking" placeholder="如：1/3" class="form-input" />
        </el-form-item>
        <el-form-item label="注册时间" required>
          <el-date-picker
            v-model="page.form.registerDate"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            :disabled-date="disabledDate"
          />
        </el-form-item>
        <el-form-item label="证明材料">
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

  <DuplicateCheckDialog
    :visible="page.duplicateVisible"
    :duplicates="page.duplicateItems"
    @confirm="page.confirmDuplicateSubmit"
    @cancel="page.cancelDuplicateSubmit"
    @update:visible="
      (v) => {
        if (!v) page.cancelDuplicateSubmit()
      }
    "
  />
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
