<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { INDUSTRY_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import DictColumn from '@/shared/ui/DictColumn.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface InnovationStarItem {
  id: string
  companyName: string
  semester: string
  industryType: string
  ranking: string
  registerDate: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    companyName: '',
    semester: '',
    industryType: '',
    ranking: '',
    registerDate: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<InnovationStarItem[]>([
  { id: '1', companyName: '智创未来科技有限公司', semester: '2023-2024-1', industryType: 'it', ranking: '1/3', registerDate: '2025-06', status: 'submitted', submitDate: '2025-07-01', proofMaterials: [] },
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

function edit(row: InnovationStarItem) {
  editingId.value = row.id
  Object.assign(form, {
    companyName: row.companyName,
    semester: row.semester,
    industryType: row.industryType,
    ranking: row.ranking,
    registerDate: row.registerDate,
    proofMaterials: row.proofMaterials,
  })
}

function remove(row: InnovationStarItem) {
  ElMessageBox.confirm(`确定删除 "${row.companyName}" 的报名记录吗？`, '提示', { type: 'warning' })
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
    alert-title="双创之星报名说明"
    alert-description="双创之星用于评选在创新创业实践中表现突出的同学。请填写公司信息、行业类型、申报人排名及注册时间，提交后可在下方查看报名记录。"
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
        <el-form-item label="公司名称" required><el-input v-model="form.companyName" /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="form.semester" placeholder="请选择" class="form-select">
            <el-option v-for="s in SEMESTER_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="行业类型" required>
          <el-select v-model="form.industryType" placeholder="请选择" class="form-select">
            <el-option v-for="t in INDUSTRY_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报人排名" required>
          <el-input v-model="form.ranking" placeholder="如：1/3" class="form-input" />
        </el-form-item>
        <el-form-item label="注册时间" required><el-date-picker v-model="form.registerDate" type="month" /></el-form-item>
        <el-form-item label="证明材料">
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="companyName" label="公司名称" min-width="220" />
      <el-table-column label="行业类型" width="140">
        <template #default="{ row }">
          <DictColumn :value="(row as InnovationStarItem).industryType" :options="INDUSTRY_TYPES" />
        </template>
      </el-table-column>
      <el-table-column prop="ranking" label="申报人排名" width="130" />
      <el-table-column prop="registerDate" label="注册时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <StatusTag :status="(row as InnovationStarItem).status" size="small" />
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
