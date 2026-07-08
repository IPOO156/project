<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    certType: '',
    certName: '',
    certDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const { form, submitting, handleSubmit: _submit } = useApplicationForm({ emptyForm })
const { clearDraft } = useFormDraft('certificate', form as Record<string, unknown>)

async function handleSubmit() {
  await _submit()
  clearDraft()
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="荣誉证书申报说明"
    alert-description="请填写获得的荣誉证书信息，并上传证书扫描件等佐证材料。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="证书类型" required
          ><el-input v-model="form.certType" placeholder="请输入证书类型"
        /></el-form-item>
        <el-form-item label="证书名称" required
          ><el-input v-model="form.certName" placeholder="请输入证书名称"
        /></el-form-item>
        <el-form-item label="获得时间" required
          ><el-date-picker v-model="form.certDate" type="month" placeholder="选择年月"
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
