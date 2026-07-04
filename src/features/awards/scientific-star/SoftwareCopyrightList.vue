<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface SoftwareCopyrightItem {
  id: string
  softName: string
  issuer: string
  ranking: string
  approveDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    softName: '',
    issuer: '',
    ranking: '',
    approveDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<SoftwareCopyrightItem[]>([
  {
    id: '1',
    softName: '智能档案管理系统 V1.0',
    issuer: '国家版权局',
    ranking: '1/4',
    approveDate: '2025-11',
    semester: '2023-2024-1',
    status: 'approved',
    submitDate: '2025-11-01',
    proofMaterials: [],
  },
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
      const idx = list.value.findIndex((i) => i.id === editingId.value)
      if (idx > -1) {
        list.value[idx] = {
          ...list.value[idx],
          ...form,
          status: 'submitted',
          submitDate: new Date().toISOString().slice(0, 10),
        }
      }
      ElMessage.success('报名信息已更新')
    } else {
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

function edit(row: SoftwareCopyrightItem) {
  editingId.value = row.id
  Object.assign(form, {
    softName: row.softName,
    issuer: row.issuer,
    ranking: row.ranking,
    approveDate: row.approveDate,
    semester: row.semester,
    proofMaterials: row.proofMaterials,
  })
}

function remove(row: SoftwareCopyrightItem) {
  ElMessageBox.confirm(`确定删除 "${row.softName}" 的报名记录吗？`, '提示', { type: 'warning' })
    .then(() => {
      list.value = list.value.filter((i) => i.id !== row.id)
      ElMessage.success('删除成功')
      if (editingId.value === row.id) reset()
    })
    .catch(() => {})
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="软件著作权申报说明"
    alert-description="请填写软件著作权信息，提交后可在下方查看记录。"
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
        <el-form-item label="软著名称" required><el-input v-model="form.softName" /></el-form-item>
        <el-form-item label="颁发单位" required><el-input v-model="form.issuer" /></el-form-item>
        <el-form-item label="排名/总人数" required>
          <el-input v-model="form.ranking" placeholder="如：1/4" class="form-input" />
        </el-form-item>
        <el-form-item label="获批时间" required
          ><el-date-picker v-model="form.approveDate" type="month"
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
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="softName" label="软著名称" min-width="220" />
      <el-table-column prop="issuer" label="颁发单位" width="180" />
      <el-table-column prop="ranking" label="排名/总人数" width="130" />
      <el-table-column prop="approveDate" label="获批时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <StatusTag :status="(row as SoftwareCopyrightItem).status" size="small" />
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
