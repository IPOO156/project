<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import StatusTag from '@/shared/ui/StatusTag.vue'

interface BookReportItem {
  id: string
  bookName: string
  bookDate: string
  review: string
  semester: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitDate: string
  proofMaterials: string[]
}

function emptyForm() {
  return {
    bookName: '',
    bookDate: '',
    review: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const form = reactive(emptyForm())
const list = ref<BookReportItem[]>([
  { id: '1', bookName: '深入理解计算机系统', bookDate: '2025-05', review: '本书让我对计算机底层原理有了更深入的理解', semester: '2023-2024-1', status: 'approved', submitDate: '2025-10-01', proofMaterials: [] },
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

function edit(row: BookReportItem) {
  editingId.value = row.id
  Object.assign(form, {
    bookName: row.bookName,
    bookDate: row.bookDate,
    review: row.review,
    semester: row.semester,
  })
}

function remove(row: BookReportItem) {
  ElMessageBox.confirm(`确定删除 "${row.bookName}" 的申报记录吗？`, '提示', { type: 'warning' })
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
    alert-title="图书心得申报说明"
    alert-description="请填写阅读图书的心得体会，并上传心得文档等佐证材料。"
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
        <el-form-item label="图书名称" required><el-input v-model="form.bookName" placeholder="请输入图书名称" /></el-form-item>
        <el-form-item label="阅读时间" required><el-date-picker v-model="form.bookDate" type="month" placeholder="选择年月" /></el-form-item>
        <el-form-item label="心得体会" required>
          <el-input v-model="form.review" type="textarea" :rows="4" placeholder="请输入心得体会" />
        </el-form-item>
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
      <el-table-column prop="bookName" label="图书名称" min-width="180" />
      <el-table-column prop="bookDate" label="阅读时间" width="120" />
      <el-table-column prop="semester" label="学期" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><StatusTag :status="(row as BookReportItem).status" size="small" /></template>
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
