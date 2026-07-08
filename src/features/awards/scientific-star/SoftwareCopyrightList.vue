<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
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

const form = reactive(emptyForm())
const { clearDraft } = useFormDraft('software-copyright', form as Record<string, unknown>, {
  afterRestore: () => sanitizeSemesterMonthPair(form, 'approveDate', 'semester'),
})
const submitting = ref(false)

const disabledDate = computed(() => buildSemesterMonthDisabledDate(form.semester))

watch(
  () => form.semester,
  () => {
    sanitizeSemesterMonthPair(form, 'approveDate', 'semester')
  },
)

function reset() {
  Object.assign(form, emptyForm())
}

function handleSubmit() {
  sanitizeSemesterMonthPair(form, 'approveDate', 'semester')
  if (!isMonthInSemester(form.approveDate, form.semester)) {
    ElMessage.error('获批时间与学期不匹配，请重新选择')
    return
  }
  submitting.value = true
  setTimeout(() => {
    ElMessage.success('报名提交成功')
    clearDraft()
    reset()
    submitting.value = false
  }, 600)
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="软件著作权申报说明"
    alert-description="请填写软件著作权信息，提交后可在下方查看记录。"
    :show-alert="false"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="软著名称" required><el-input v-model="form.softName" /></el-form-item>
        <el-form-item label="颁发单位" required><el-input v-model="form.issuer" /></el-form-item>
        <el-form-item label="排名/总人数" required>
          <el-input v-model="form.ranking" placeholder="如：1/4" class="form-input" />
        </el-form-item>
        <el-form-item label="获批时间" required>
          <el-date-picker
            v-model="form.approveDate"
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
