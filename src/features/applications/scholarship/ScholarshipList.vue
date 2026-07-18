<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { useFormEdit } from '@/shared/composables/useFormEdit'
import { useFormRecords } from '@/shared/composables/useFormRecords'
import { SCHOLARSHIP_GRADES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

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

const {
  form,
  submitting,
  handleSubmit: _submit,
} = useApplicationForm({
  emptyForm,
  requiredFields: ['awardName', 'scholarshipLevel', 'scholarshipGrade', 'acquireDate', 'semester'],
  type: 'scholarship',
  typeLabel: '奖学金',
})
const { clearDraft } = useFormDraft('scholarship', form)
const { records, addRecord, updateRecord, removeRecord } = useFormRecords('scholarship')

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
  const name = form.awardName || '新记录'
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
  form.awardName = row.awardName || ''
  form.scholarshipLevel = row.scholarshipLevel || ''
  form.scholarshipGrade = row.scholarshipGrade || ''
  form.acquireDate = row.acquireDate || ''
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
    alert-title="奖学金申报说明"
    alert-description="请填写奖学金获奖信息，并上传奖学金证书或公示文件等佐证材料。"
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
