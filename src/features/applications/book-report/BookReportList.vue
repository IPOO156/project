<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    bookName: '',
    bookDate: '',
    review: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const { form, submitting, handleSubmit } = useApplicationForm({ emptyForm })
</script>

<template>
  <ApplicationFormRecord
    alert-title="图书心得申报说明"
    alert-description="请填写阅读图书的心得体会，并上传心得文档等佐证材料。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="图书名称" required
          ><el-input v-model="form.bookName" placeholder="请输入图书名称"
        /></el-form-item>
        <el-form-item label="阅读时间" required
          ><el-date-picker v-model="form.bookDate" type="month" placeholder="选择年月"
        /></el-form-item>
        <el-form-item label="心得体会" required>
          <el-input v-model="form.review" type="textarea" :rows="4" placeholder="请输入心得体会" />
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
        <el-form-item label="佐证材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
  </ApplicationFormRecord>
</template>
