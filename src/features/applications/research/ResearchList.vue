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
    projectName: '',
    projectLevel: '',
    researchType: '',
    teamRole: '',
    projectDate: '',
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
  requiredFields: [
    'projectName',
    'projectLevel',
    'researchType',
    'teamRole',
    'projectDate',
    'semester',
  ],
  type: 'research',
  typeLabel: '学术研究',
})
const { clearDraft } = useFormDraft('research', form)
const { records, addRecord, updateRecord, removeRecord } = useFormRecords('research')

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
  const name = form.projectName || '新记录'
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
  form.projectName = row.projectName || ''
  form.projectLevel = row.projectLevel || ''
  form.researchType = row.researchType || ''
  form.teamRole = row.teamRole || ''
  form.projectDate = row.projectDate || ''
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
    alert-title="学术研究申报说明"
    alert-description="请填写参与的学术研究项目信息，并上传项目立项书、结题报告等佐证材料。"
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
        <el-form-item label="项目名称" required
          ><el-input v-model="form.projectName" placeholder="请输入项目名称"
        /></el-form-item>
        <el-form-item label="项目级别" required
          ><el-input v-model="form.projectLevel" placeholder="请输入项目级别"
        /></el-form-item>
        <el-form-item label="研究类型" required
          ><el-input v-model="form.researchType" placeholder="请输入研究类型"
        /></el-form-item>
        <el-form-item label="团队角色" required
          ><el-input v-model="form.teamRole" placeholder="请输入团队角色"
        /></el-form-item>
        <el-form-item label="项目时间" required
          ><el-date-picker v-model="form.projectDate" type="month" placeholder="选择年月"
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
