<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface TrainingItem {
  id: string
  projectName: string
  projectContent: string
  startDate: string
  endDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

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

const form = reactive(emptyForm())
const list = ref<TrainingItem[]>([
  { id: '1', projectName: '智能校园助手', projectContent: '参与企业级项目开发实训', startDate: '2025-07-01', endDate: '2025-09-01', semester: '2023-2024-1', status: 'approved', submitDate: '2025-10-01', proofMaterials: [] },
])
const editingId = ref<string | null>(null)
const submitting = ref(false)

function reset() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

function handleSubmit() {
  submitting.value = true
  setTimeout(() => {
    if (editingId.value) {
      const idx = list.value.findIndex(i => i.id === editingId.value)
      if (idx > -1) {
        list.value[idx] = {
          ...list.value[idx],
          ...form,
          status: 'submitted',
          submitDate: new Date().toISOString().slice(0, 10),
        }
      }
      ElMessage.success('申报信息已更新')
    }
    else {
      list.value.unshift({
        id: `${Date.now()}`,
        ...form,
        status: 'submitted',
        submitDate: new Date().toISOString().slice(0, 10),
        proofMaterials: [],
      })
      ElMessage.success('申报提交成功')
    }
    reset()
    submitting.value = false
  }, 600)
}

function edit(row: TrainingItem) {
  editingId.value = row.id
  Object.assign(form, {
    projectName: row.projectName,
    projectContent: row.projectContent,
    startDate: row.startDate,
    endDate: row.endDate,
    semester: row.semester,
  })
}

function remove(row: TrainingItem) {
  ElMessageBox.confirm(`确定删除 "${row.projectName}" 的申报记录吗？`, '提示', { type: 'warning' })
    .then(() => {
      list.value = list.value.filter(i => i.id !== row.id)
      ElMessage.success('删除成功')
      if (editingId.value === row.id)
        reset()
    })
    .catch(() => {})
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="实训项目申报说明"
    alert-description="请填写参与的实训项目信息，并上传结业证书等佐证材料。"
    :is-editing="!!editingId"
    :submitting="submitting"
    :records="list"
    @submit="handleSubmit"
    @cancel="reset"
    @edit="edit"
    @remove="remove"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="项目名称" required><el-input v-model="form.projectName" placeholder="请输入项目名称" /></el-form-item>
        <el-form-item label="项目内容" required><el-input v-model="form.projectContent" type="textarea" :rows="3" placeholder="请输入项目内容" /></el-form-item>
        <el-form-item label="开始时间" required><el-date-picker v-model="form.startDate" type="date" placeholder="选择日期" /></el-form-item>
        <el-form-item label="结束时间" required><el-date-picker v-model="form.endDate" type="date" placeholder="选择日期" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="form.semester" placeholder="请选择" class="form-select">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="projectName" label="项目名称" min-width="180" />
      <el-table-column prop="projectContent" label="项目内容" min-width="200" show-overflow-tooltip />
      <el-table-column prop="startDate" label="开始时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag :status="(row as TrainingItem).status" size="small" /></template>
      </el-table-column>
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
