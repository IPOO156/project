<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    activityName: '',
    location: '',
    organization: '',
    startDate: '',
    endDate: '',
    volunteerHours: 0,
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
    ElMessage.success('申报提交成功')
    reset()
    submitting.value = false
  }, 600)
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="社会实践申报说明"
    alert-description="请填写社会实践活动信息，并上传实践证明等佐证材料。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="活动名称" required
          ><el-input v-model="form.activityName" placeholder="请输入活动名称"
        /></el-form-item>
        <el-form-item label="活动地点" required
          ><el-input v-model="form.location" placeholder="请输入活动地点"
        /></el-form-item>
        <el-form-item label="组织单位" required
          ><el-input v-model="form.organization" placeholder="请输入组织单位"
        /></el-form-item>
        <el-form-item label="开始时间" required
          ><el-date-picker v-model="form.startDate" type="date" placeholder="选择日期"
        /></el-form-item>
        <el-form-item label="结束时间" required
          ><el-date-picker v-model="form.endDate" type="date" placeholder="选择日期"
        /></el-form-item>
        <el-form-item label="志愿时长">
          <el-input-number
            v-model="form.volunteerHours"
            :min="0"
            controls-position="right"
            class="form-input-number"
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

.form-input-number {
  width: 200px;
}
</style>
