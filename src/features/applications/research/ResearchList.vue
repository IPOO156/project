<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface ResearchItem {
  id: string
  projectName: string
  projectLevel: string
  researchType: string
  teamRole: string
  projectDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

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

const form = reactive(emptyForm())
const list = ref<ResearchItem[]>([
  { id: '1', projectName: '智能校园助手', projectLevel: '校级', researchType: '应用研究', teamRole: '核心成员', projectDate: '2025-06', semester: '2023-2024-1', status: 'approved', submitDate: '2025-10-01', proofMaterials: [] },
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

function edit(row: ResearchItem) {
  editingId.value = row.id
  Object.assign(form, {
    projectName: row.projectName,
    projectLevel: row.projectLevel,
    researchType: row.researchType,
    teamRole: row.teamRole,
    projectDate: row.projectDate,
    semester: row.semester,
  })
}

function remove(row: ResearchItem) {
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
    alert-title="学术研究申报说明"
    alert-description="请填写参与的学术研究项目信息，并上传项目立项书、结题报告等佐证材料。"
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
        <el-form-item label="项目级别" required><el-input v-model="form.projectLevel" placeholder="请输入项目级别" /></el-form-item>
        <el-form-item label="研究类型" required><el-input v-model="form.researchType" placeholder="请输入研究类型" /></el-form-item>
        <el-form-item label="团队角色" required><el-input v-model="form.teamRole" placeholder="请输入团队角色" /></el-form-item>
        <el-form-item label="项目时间" required><el-date-picker v-model="form.projectDate" type="month" placeholder="选择年月" /></el-form-item>
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
      <el-table-column prop="projectLevel" label="项目级别" width="120" />
      <el-table-column prop="projectDate" label="项目时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag :status="(row as ResearchItem).status" size="small" /></template>
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
