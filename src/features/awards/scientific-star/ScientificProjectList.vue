<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { submitApplication } from '@/shared/api/submission'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { useFormEdit } from '@/shared/composables/useFormEdit'
import { useFormRecords } from '@/shared/composables/useFormRecords'
import { PROJECT_LEVELS, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import {
  buildSemesterMonthDisabledDate,
  isMonthInSemester,
  sanitizeSemesterMonthPair,
} from '@/shared/utils/semester'

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

const form = reactive(emptyForm())
const { clearDraft } = useFormDraft('scientific-project', form, {
  afterRestore: () => sanitizeSemesterMonthPair(form, 'startDate', 'semester'),
})
const submitting = ref(false)
const { records, addRecord, updateRecord, removeRecord } = useFormRecords('scientificProject')
const {
  editingId,
  detailVisible,
  detailRecord,
  isEditing,
  viewRecord,
  startEdit,
  cancelEdit,
  closeDetail,
} = useFormEdit()

const disabledDate = computed(() => buildSemesterMonthDisabledDate(form.semester))

watch(
  () => form.semester,
  () => {
    sanitizeSemesterMonthPair(form, 'startDate', 'semester')
  },
)

function reset() {
  Object.assign(form, emptyForm())
}

function handleEditClick(row: any) {
  form.projectName = row.projectName || ''
  form.projectLevel = row.projectLevel || ''
  form.ranking = row.ranking || ''
  form.startDate = row.startDate || ''
  form.semester = row.semester || ''
  startEdit(row)
}

function handleCancel() {
  cancelEdit()
  Object.assign(form, emptyForm())
}

async function handleSubmit() {
  sanitizeSemesterMonthPair(form, 'startDate', 'semester')
  if (!isMonthInSemester(form.startDate, form.semester)) {
    ElMessage.error('立项时间与学期不匹配，请重新选择')
    return
  }
  submitting.value = true
  try {
    await submitApplication({ type: 'scientificProject', typeLabel: '科研之星报名', ...form })
    ElMessage.success('报名提交成功')
    if (editingId.value) {
      updateRecord(editingId.value, { title: form.projectName || '科研项目申报', ...form })
      editingId.value = null
    } else {
      addRecord(form.projectName || '科研项目申报')
    }
    clearDraft()
    reset()
  } catch {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="科研项目申报说明"
    alert-description="请填写科研项目信息，提交后可在下方查看记录。"
    :show-alert="false"
    :show-records="true"
    :records="records"
    :submitting="submitting"
    :is-editing="isEditing"
    @submit="handleSubmit"
    @view="(row) => viewRecord(row)"
    @edit="(row) => handleEditClick(row)"
    @cancel="handleCancel"
    @remove="removeRecord($event.id)"
  >
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="submitDate" label="提交日期" width="120" />
    </template>
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="项目名称" required
          ><el-input v-model="form.projectName"
        /></el-form-item>
        <el-form-item label="项目级别" required>
          <el-select v-model="form.projectLevel" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in PROJECT_LEVELS"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排名/总人数" required>
          <el-input v-model="form.ranking" placeholder="如：2/5" class="form-input" />
        </el-form-item>
        <el-form-item label="立项时间" required>
          <el-date-picker
            v-model="form.startDate"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            :disabled-date="disabledDate"
          />
        </el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="form.semester" placeholder="请选择" class="form-select">
            <el-option
              v-for="s in SEMESTER_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
  </ApplicationFormRecord>
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
