<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    projectName: '',
    projectLevel: '',
    researchType: '',
    teamRole: '',
    projectDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const {
  form,
  submitting,
  handleSubmit: _submit,
} = useApplicationForm({
  emptyForm,
  requiredFields: [
    'projectName',
    'projectLevel',
    'researchType',
    'teamRole',
    'projectDate',
    'semester',
  ],
})
const { clearDraft } = useFormDraft('research', form)

async function handleSubmit() {
  await _submit()
  clearDraft()
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="学术研究申报说明"
    alert-description="请填写参与的学术研究项目信息，并上传项目立项书、结题报告等佐证材料。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="项目名称" required
          ><el-input v-model="form.projectName" placeholder="请输入项目名称"
        /></el-form-item>
        <el-form-item label="项目级别" required
          ><el-input v-model="form.projectLevel" placeholder="请输入项目级别"
        /></el-form-item>
        <el-form-item label="研究类型" required
          ><el-input v-model="form.researchType" placeholder="请输入研究类型"
        /></el-form-item>
        <el-form-item label="团队角色" required
          ><el-input v-model="form.teamRole" placeholder="请输入团队角色"
        /></el-form-item>
        <el-form-item label="项目时间" required
          ><el-date-picker v-model="form.projectDate" type="month" placeholder="选择年月"
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
