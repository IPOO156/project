<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { INNOVATION_COMPANY_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    companyName: '',
    industryType: '',
    companyType: '',
    teamRole: '',
    registerDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const { form, submitting, handleSubmit } = useApplicationForm({ emptyForm })
</script>

<template>
  <ApplicationFormRecord
    alert-title="创新创业申报说明"
    alert-description="请填写创新创业项目或企业相关信息，并上传营业执照、项目计划书等佐证材料。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="公司名称" required
          ><el-input v-model="form.companyName" placeholder="请输入公司名称"
        /></el-form-item>
        <el-form-item label="行业类型" required
          ><el-input v-model="form.industryType" placeholder="请输入行业类型"
        /></el-form-item>
        <el-form-item label="公司类型" required>
          <el-select v-model="form.companyType" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in INNOVATION_COMPANY_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="团队角色" required
          ><el-input v-model="form.teamRole" placeholder="请输入团队角色"
        /></el-form-item>
        <el-form-item label="注册时间" required
          ><el-date-picker v-model="form.registerDate" type="date" placeholder="选择日期"
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
          <ProofUpload v-model:file-list="form.proofMaterials" tip="支持 pdf、doc、docx 格式" />
        </el-form-item>
      </el-form>
    </template>
  </ApplicationFormRecord>
</template>
