<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    projectName: '',
    projectContent: '',
    startDate: '',
    endDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const { form, submitting, handleSubmit: _submit } = useApplicationForm({ emptyForm })
const { clearDraft } = useFormDraft('training', form as Record<string, unknown>)

async function handleSubmit() {
  await _submit()
  clearDraft()
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="实训项目申报说明"
    alert-description="请填写参与的实训项目信息，并上传结业证书等佐证材料。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="项目名称" required
          ><el-input v-model="form.projectName" placeholder="请输入项目名称"
        /></el-form-item>
        <el-form-item label="项目内容" required
          ><el-input
            v-model="form.projectContent"
            type="textarea"
            :rows="3"
            placeholder="请输入项目内容"
        /></el-form-item>
        <el-form-item label="开始时间" required
          ><el-date-picker v-model="form.startDate" type="date" placeholder="选择日期"
        /></el-form-item>
        <el-form-item label="结束时间" required
          ><el-date-picker v-model="form.endDate" type="date" placeholder="选择日期"
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
        <el-form-item label="佐证材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
  </ApplicationFormRecord>
</template>

<style scoped lang="scss">
:deep(.page-container) {
  user-select: none;
}
</style>
