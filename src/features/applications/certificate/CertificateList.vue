<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { useFormEdit } from '@/shared/composables/useFormEdit'
import { useFormRecords } from '@/shared/composables/useFormRecords'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    certType: '',
    certName: '',
    certDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const {
  form,
  submitting,
  handleSubmit: _submit,
} = useApplicationForm({
  emptyForm,
  requiredFields: ['certType', 'certName', 'certDate', 'semester'],
  type: 'certificate',
  typeLabel: '荣誉证书',
})
const { clearDraft } = useFormDraft('certificate', form)
const { records, addRecord, updateRecord, removeRecord } = useFormRecords('certificate')

const {
  editingId,
  detailVisible,
  detailRecord,
  isEditing,
  viewRecord,
  startEdit,
  cancelEdit,
  closeDetail,
} = useFormEdit()

async function handleSubmit() {
  const name = form.certName || '新记录'
  await _submit()
  if (editingId.value) {
    updateRecord(editingId.value, {
      title: name,
      ...form,
      submitDate: new Date().toISOString().slice(0, 10),
    })
    editingId.value = null
  } else {
    addRecord(name)
  }
  clearDraft()
}

function handleEditClick(row: any) {
  form.certName = row.certName || ''
  form.certType = row.certType || ''
  form.certDate = row.certDate || ''
  form.semester = row.semester || ''
  startEdit(row)
}

function handleCancel() {
  cancelEdit()
  Object.assign(form, emptyForm())
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="荣誉证书申报说明"
    alert-description="请填写获得的荣誉证书信息，并上传证书扫描件等佐证材料。"
    :show-records="true"
    :records="records"
    :submitting="submitting"
    :is-editing="isEditing"
    @submit="handleSubmit"
    @view="(row) => viewRecord(row)"
    @edit="(row) => handleEditClick(row)"
    @remove="(row) => removeRecord(row.id)"
    @cancel="handleCancel"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="证书类型" required
          ><el-input v-model="form.certType" placeholder="请输入证书类型"
        /></el-form-item>
        <el-form-item label="证书名称" required
          ><el-input v-model="form.certName" placeholder="请输入证书名称"
        /></el-form-item>
        <el-form-item label="获得时间" required
          ><el-date-picker v-model="form.certDate" type="month" placeholder="选择年月"
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
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="submitDate" label="提交日期" width="120" />
    </template>
  </ApplicationFormRecord>
  <el-dialog v-model="detailVisible" title="记录详情" width="560px">
    <template v-if="detailRecord">
      <el-descriptions :column="1" border>
        <el-descriptions-item
          v-for="(val, key) in detailRecord"
          :key="String(key)"
          :label="String(key)"
        >
          {{ String(val) }}
        </el-descriptions-item>
      </el-descriptions>
    </template>
    <template #footer>
      <el-button @click="closeDetail">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
:deep(.page-container) {
  user-select: none;
}
</style>
