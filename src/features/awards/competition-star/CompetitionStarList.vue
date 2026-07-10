<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { submitApplication } from '@/shared/api/submission'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { useFormEdit } from '@/shared/composables/useFormEdit'
import { useFormRecords } from '@/shared/composables/useFormRecords'
import { AWARD_LEVELS, COMPETITION_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import {
  buildSemesterMonthDisabledDate,
  isMonthInSemester,
  sanitizeSemesterMonthPair,
} from '@/shared/utils/semester'

function emptyForm() {
  return {
    semester: '',
    competitionName: '',
    competitionDate: '',
    competitionLevel: '',
    awardLevel: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const { clearDraft } = useFormDraft('competition-star', form, {
  afterRestore: () => sanitizeSemesterMonthPair(form, 'competitionDate', 'semester'),
})
const submitting = ref(false)
const { records, addRecord, updateRecord, removeRecord } = useFormRecords('competitionStar')
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
    sanitizeSemesterMonthPair(form, 'competitionDate', 'semester')
  },
)

function reset() {
  Object.assign(form, emptyForm())
}

function handleEditClick(row: any) {
  form.competitionName = row.competitionName || ''
  form.competitionDate = row.competitionDate || ''
  form.competitionLevel = row.competitionLevel || ''
  form.awardLevel = row.awardLevel || ''
  form.semester = row.semester || ''
  startEdit(row)
}

function handleCancel() {
  cancelEdit()
  Object.assign(form, emptyForm())
}

async function handleSubmit() {
  sanitizeSemesterMonthPair(form, 'competitionDate', 'semester')
  if (!isMonthInSemester(form.competitionDate, form.semester)) {
    ElMessage.error('参赛时间与学期不匹配，请重新选择')
    return
  }
  submitting.value = true
  try {
    await submitApplication({ type: 'competitionStar', typeLabel: '竞赛之星报名', ...form })
    ElMessage.success('报名提交成功')
    if (editingId.value) {
      updateRecord(editingId.value, { title: form.competitionName || '竞赛之星报名', ...form })
      editingId.value = null
    } else {
      addRecord(form.competitionName || '竞赛之星报名')
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
    alert-title="竞赛之星报名说明"
    alert-description="竞赛之星用于评选在学科竞赛中表现突出的同学。请填写参赛信息及获奖情况，提交后可在下方查看报名记录。"
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
        <el-form-item label="竞赛名称" required
          ><el-input v-model="form.competitionName"
        /></el-form-item>
        <el-form-item label="参赛时间" required>
          <el-date-picker
            v-model="form.competitionDate"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            :disabled-date="disabledDate"
          />
        </el-form-item>
        <el-form-item label="竞赛级别" required>
          <el-select v-model="form.competitionLevel" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in COMPETITION_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖级别" required>
          <el-select v-model="form.awardLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in AWARD_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
  </ApplicationFormRecord>
</template>

<style scoped lang="scss">
.form-select {
  width: 200px;
}

:deep(.page-container) {
  user-select: none;
}
</style>
