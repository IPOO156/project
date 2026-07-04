<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface SocialPracticeItem {
  id: string
  activityName: string
  location: string
  organization: string
  startDate: string
  endDate: string
  volunteerHours: number
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

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
const list = ref<SocialPracticeItem[]>([
  {
    id: '1',
    activityName: '社区志愿服务',
    location: '社区服务中心',
    organization: '校志愿者协会',
    startDate: '2025-07-01',
    endDate: '2025-09-01',
    volunteerHours: 20,
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

function edit(row: SocialPracticeItem) {
  editingId.value = row.id
  Object.assign(form, {
    activityName: row.activityName,
    location: row.location,
    organization: row.organization,
    startDate: row.startDate,
    endDate: row.endDate,
    volunteerHours: row.volunteerHours,
    semester: row.semester,
  })
}

function remove(row: SocialPracticeItem) {
  ElMessageBox.confirm(`确定删除 "${row.activityName}" 的申报记录吗？`, '提示', { type: 'warning' })
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
    alert-title="社会实践申报说明"
    alert-description="请填写社会实践活动信息，并上传实践证明等佐证材料。"
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
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="activityName" label="活动名称" min-width="160" />
      <el-table-column prop="organization" label="组织单位" min-width="140" />
      <el-table-column prop="startDate" label="开始时间" width="120" />
      <el-table-column prop="volunteerHours" label="志愿时长" width="100" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"
          ><StatusTag :status="(row as SocialPracticeItem).status" size="small"
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
