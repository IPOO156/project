<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { INDUSTRY_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
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

const form = reactive(emptyForm())
const { clearDraft } = useFormDraft('innovation-star', form, {
  afterRestore: () => sanitizeSemesterMonthPair(form, 'registerDate', 'semester'),
})
const submitting = ref(false)

const disabledDate = computed(() => buildSemesterMonthDisabledDate(form.semester))

watch(
  () => form.semester,
  () => {
    sanitizeSemesterMonthPair(form, 'registerDate', 'semester')
  },
)

function reset() {
  Object.assign(form, emptyForm())
}

function handleSubmit() {
  sanitizeSemesterMonthPair(form, 'registerDate', 'semester')
  if (!isMonthInSemester(form.registerDate, form.semester)) {
    ElMessage.error('注册时间与学期不匹配，请重新选择')
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
    alert-title="双创之星报名说明"
    alert-description="双创之星用于评选在创新创业实践中表现突出的同学。请填写公司信息、行业类型、申报人排名及注册时间，提交后可在下方查看报名记录。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="公司名称" required
          ><el-input v-model="form.companyName"
        /></el-form-item>
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
        <el-form-item label="行业类型" required>
          <el-select v-model="form.industryType" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in INDUSTRY_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申报人排名" required>
          <el-input v-model="form.ranking" placeholder="如：1/3" class="form-input" />
        </el-form-item>
        <el-form-item label="注册时间" required>
          <el-date-picker
            v-model="form.registerDate"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            :disabled-date="disabledDate"
          />
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
