<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    journalName: '',
    paperName: '',
    ranking: '',
    publishDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const submitting = ref(false)

function reset() {
  Object.assign(form, emptyForm())
}

function handleSubmit() {
  submitting.value = true
  setTimeout(() => {
    ElMessage.success('报名提交成功')
    reset()
    submitting.value = false
  }, 600)
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="论文申报说明"
    alert-description="请填写论文信息，提交后可在下方查看记录。"
    :show-alert="false"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="期刊名称" required
          ><el-input v-model="form.journalName"
        /></el-form-item>
        <el-form-item label="论文名称" required><el-input v-model="form.paperName" /></el-form-item>
        <el-form-item label="排名/总人数" required>
          <el-input v-model="form.ranking" placeholder="如：2/3" class="form-input" />
        </el-form-item>
        <el-form-item label="发表时间" required
          ><el-date-picker v-model="form.publishDate" type="month"
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
</style>
