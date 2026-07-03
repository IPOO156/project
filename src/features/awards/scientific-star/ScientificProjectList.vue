<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { PROJECT_LEVELS, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import DictColumn from '@/shared/ui/DictColumn.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface ScientificProjectItem {
  id: string
  projectName: string
  projectLevel: string
  ranking: string
  startDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    projectName: '',
    projectLevel: '',
    ranking: '',
    startDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<ScientificProjectItem[]>([
  { id: '1', projectName: '基于知识图谱的智能推荐系统', projectLevel: 'school', ranking: '2/5', startDate: '2025-03', semester: '2023-2024-2', status: 'submitted', submitDate: '2025-04-01', proofMaterials: [] },
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
      ElMessage.success('报名信息已更新')
    }
    else {
      list.value.unshift({
        id: `${Date.now()}`,
        ...form,
        status: 'submitted',
        submitDate: new Date().toISOString().slice(0, 10),
        proofMaterials: [],
      })
      ElMessage.success('报名提交成功')
    }
    reset()
    submitting.value = false
  }, 600)
}

function edit(row: ScientificProjectItem) {
  editingId.value = row.id
  Object.assign(form, {
    projectName: row.projectName,
    projectLevel: row.projectLevel,
    ranking: row.ranking,
    startDate: row.startDate,
    semester: row.semester,
    proofMaterials: row.proofMaterials,
  })
}

function remove(row: ScientificProjectItem) {
  ElMessageBox.confirm(`确定删除 "${row.projectName}" 的报名记录吗？`, '提示', { type: 'warning' })
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
    alert-title="科研项目申报说明"
    alert-description="请填写科研项目信息，提交后可在下方查看记录。"
    :show-alert="false"
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
        <el-form-item label="项目名称" required><el-input v-model="form.projectName" /></el-form-item>
        <el-form-item label="项目级别" required>
          <el-select v-model="form.projectLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in PROJECT_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排名/总人数" required>
          <el-input v-model="form.ranking" placeholder="如：2/5" class="form-input" />
        </el-form-item>
        <el-form-item label="立项时间" required><el-date-picker v-model="form.startDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="form.semester" placeholder="请选择" class="form-select">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="projectName" label="项目名称" min-width="220" />
      <el-table-column label="项目级别" width="120">
        <template #default="{ row }">
          <DictColumn :value="(row as ScientificProjectItem).projectLevel" :options="PROJECT_LEVELS" />
        </template>
      </el-table-column>
      <el-table-column prop="ranking" label="排名/总人数" width="130" />
      <el-table-column prop="startDate" label="立项时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <StatusTag :status="(row as ScientificProjectItem).status" size="small" />
        </template>
      </el-table-column>
    </template>
  </ApplicationFormRecord>
</template>

<style scoped lang="scss">
.form-select,
.form-input {
  width: 200px;
}
</style>
