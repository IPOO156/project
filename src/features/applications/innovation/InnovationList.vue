<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { INNOVATION_COMPANY_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import DictColumn from '@/shared/ui/DictColumn.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface InnovationItem {
  id: string
  companyName: string
  industryType: string
  companyType: string
  teamRole: string
  registerDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

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

const form = reactive(emptyForm())
const list = ref<InnovationItem[]>([
  {
    id: '1',
    companyName: '创新科技有限公司',
    industryType: '信息技术',
    companyType: '创业实践',
    teamRole: '核心成员',
    registerDate: '2025-03-15',
    semester: '2023-2024-1',
    status: 'approved',
    submitDate: '2025-10-01',
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
      ElMessage.success('申报信息已更新')
    } else {
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

function edit(row: InnovationItem) {
  editingId.value = row.id
  Object.assign(form, {
    companyName: row.companyName,
    industryType: row.industryType,
    companyType: row.companyType,
    teamRole: row.teamRole,
    registerDate: row.registerDate,
    semester: row.semester,
  })
}

function remove(row: InnovationItem) {
  ElMessageBox.confirm(`确定删除 "${row.companyName}" 的申报记录吗？`, '提示', { type: 'warning' })
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
    alert-title="创新创业申报说明"
    alert-description="请填写创新创业项目或企业相关信息，并上传营业执照、项目计划书等佐证材料。"
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
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="companyName" label="公司名称" min-width="180" />
      <el-table-column label="公司类型" width="120">
        <template #default="{ row }">
          <DictColumn
            :value="(row as InnovationItem).companyType"
            :options="INNOVATION_COMPANY_TYPES"
          />
        </template>
      </el-table-column>
      <el-table-column prop="registerDate" label="注册时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"
          ><StatusTag :status="(row as InnovationItem).status" size="small"
        /></template>
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
