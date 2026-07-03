<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface PaperItem {
  id: string
  journalName: string
  paperName: string
  ranking: string
  publishDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

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
const list = ref<PaperItem[]>([
  { id: '1', journalName: '《计算机科学与应用》', paperName: '基于Vue3的档案管理系统设计与实现', ranking: '2/3', publishDate: '2026-03', semester: '2023-2024-2', status: 'submitted', submitDate: '2026-03-15', proofMaterials: [] },
])
const editingId = ref<string | null>(null)
const submitting = ref(false)

function reset() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

function handleSubmit() {
  if (!form.journalName && !form.paperName && !form.ranking && !form.publishDate && !form.semester) {
    ElMessage.warning('请填写报名信息')
    return
  }
  if (form.proofMaterials.length === 0) {
    ElMessage.warning('请上传证明材料')
    return
  }
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

function edit(row: PaperItem) {
  editingId.value = row.id
  Object.assign(form, {
    journalName: row.journalName,
    paperName: row.paperName,
    ranking: row.ranking,
    publishDate: row.publishDate,
    semester: row.semester,
    proofMaterials: row.proofMaterials,
  })
}

function remove(row: PaperItem) {
  ElMessageBox.confirm(`确定删除 "${row.paperName}" 的报名记录吗？`, '提示', { type: 'warning' })
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
    alert-title="论文申报说明"
    alert-description="请填写论文信息，提交后可在下方查看记录。"
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
        <el-form-item label="期刊名称" required><el-input v-model="form.journalName" /></el-form-item>
        <el-form-item label="论文名称" required><el-input v-model="form.paperName" /></el-form-item>
        <el-form-item label="排名/总人数" required>
          <el-input v-model="form.ranking" placeholder="如：2/3" class="form-input" />
        </el-form-item>
        <el-form-item label="发表时间" required><el-date-picker v-model="form.publishDate" type="month" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="form.semester" placeholder="请选择" class="form-select">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="证明材料" required>
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="paperName" label="论文名称" min-width="250" show-overflow-tooltip />
      <el-table-column prop="journalName" label="期刊名称" width="200" show-overflow-tooltip />
      <el-table-column prop="ranking" label="排名/总人数" width="130" />
      <el-table-column prop="publishDate" label="发表时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <StatusTag :status="(row as PaperItem).status" size="small" />
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
