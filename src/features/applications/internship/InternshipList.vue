<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface InternshipItem {
  id: string
  company: string
  location: string
  position: string
  startDate: string
  endDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    company: '',
    location: '',
    position: '',
    startDate: '',
    endDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<InternshipItem[]>([
  {
    id: '1',
    company: '科技有限公司',
    location: '社区服务中心',
    position: '部长',
    startDate: '2025-07-01',
    endDate: '2025-09-01',
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

function edit(row: InternshipItem) {
  editingId.value = row.id
  Object.assign(form, {
    company: row.company,
    location: row.location,
    position: row.position,
    startDate: row.startDate,
    endDate: row.endDate,
    semester: row.semester,
  })
}

function remove(row: InternshipItem) {
  ElMessageBox.confirm(`确定删除 "${row.company}" 的申报记录吗？`, '提示', { type: 'warning' })
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
    alert-title="实习经历申报说明"
    alert-description="请填写实习经历相关信息，并上传实习证明等佐证材料。"
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
        <el-form-item label="实习公司" required
          ><el-input v-model="form.company" placeholder="请输入实习公司"
        /></el-form-item>
        <el-form-item label="实习地点" required
          ><el-input v-model="form.location" placeholder="请输入实习地点"
        /></el-form-item>
        <el-form-item label="实习岗位" required
          ><el-input v-model="form.position" placeholder="请输入实习岗位"
        /></el-form-item>
        <el-form-item label="开始时间" required
          ><el-date-picker v-model="form.startDate" type="date" placeholder="选择日期"
        /></el-form-item>
        <el-form-item label="结束时间" required
          ><el-date-picker v-model="form.endDate" type="date" placeholder="选择日期"
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
          <ProofUpload v-model:file-list="form.proofMaterials" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="company" label="实习公司" min-width="160" />
      <el-table-column prop="position" label="实习岗位" width="120" />
      <el-table-column prop="startDate" label="开始时间" width="120" />
      <el-table-column prop="endDate" label="结束时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"
          ><StatusTag :status="(row as InternshipItem).status" size="small"
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
