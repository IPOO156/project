<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { SCHOLARSHIP_GRADES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    awardName: '',
    scholarshipLevel: '',
    scholarshipGrade: '',
    acquireDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const { form, submitting, handleSubmit } = useApplicationForm({ emptyForm })
</script>

<template>
  <ApplicationFormRecord
    alert-title="奖学金申报说明"
    alert-description="请填写奖学金获奖信息，并上传奖学金证书或公示文件等佐证材料。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="奖项名称" required
          ><el-input v-model="form.awardName" placeholder="请输入奖项名称"
        /></el-form-item>
        <el-form-item label="奖学金级别" required
          ><el-input v-model="form.scholarshipLevel" placeholder="请输入奖学金级别"
        /></el-form-item>
        <el-form-item label="获奖等级" required>
          <el-select v-model="form.scholarshipGrade" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in SCHOLARSHIP_GRADES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="获得时间" required
          ><el-date-picker v-model="form.acquireDate" type="month" placeholder="选择年月"
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
