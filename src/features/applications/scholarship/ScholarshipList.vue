<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SCHOLARSHIP_GRADES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import DictColumn from '@/shared/ui/DictColumn.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface ScholarshipItem {
  id: string
  awardName: string
  scholarshipLevel: string
  scholarshipGrade: string
  acquireDate: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    awardName: '',
    scholarshipLevel: '',
    scholarshipGrade: '',
    acquireDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<ScholarshipItem[]>([
  {
    id: '1',
    awardName: '国家励志奖学金',
    scholarshipLevel: '国家级',
    scholarshipGrade: 'first',
    acquireDate: '2025-09',
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

function edit(row: ScholarshipItem) {
  editingId.value = row.id
  Object.assign(form, {
    awardName: row.awardName,
    scholarshipLevel: row.scholarshipLevel,
    scholarshipGrade: row.scholarshipGrade,
    acquireDate: row.acquireDate,
    semester: row.semester,
  })
}

function remove(row: ScholarshipItem) {
  ElMessageBox.confirm(`确定删除 "${row.awardName}" 的申报记录吗？`, '提示', { type: 'warning' })
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
    alert-title="奖学金申报说明"
    alert-description="请填写奖学金获奖信息，并上传奖学金证书或公示文件等佐证材料。"
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
        <el-form-item label="奖项名称" required
          ><el-input v-model="form.awardName" placeholder="请输入奖项名称"
        /></el-form-item>
        <el-form-item label="奖学金级别" required
          ><el-input v-model="form.scholarshipLevel" placeholder="请输入奖学金级别"
        /></el-form-item>
        <el-form-item label="获奖等级" required>
          <el-select v-model="form.scholarshipGrade" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in SCHOLARSHIP_GRADES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="获得时间" required
          ><el-date-picker v-model="form.acquireDate" type="month" placeholder="选择年月"
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
      <el-table-column prop="awardName" label="奖项名称" min-width="180" />
      <el-table-column label="获奖等级" width="120">
        <template #default="{ row }">
          <DictColumn
            :value="(row as ScholarshipItem).scholarshipGrade"
            :options="SCHOLARSHIP_GRADES"
          />
        </template>
      </el-table-column>
      <el-table-column prop="acquireDate" label="获得时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"
          ><StatusTag :status="(row as ScholarshipItem).status" size="small"
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
