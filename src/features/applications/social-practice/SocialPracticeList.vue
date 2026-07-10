<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { useFormEdit } from '@/shared/composables/useFormEdit'
import { useFormRecords } from '@/shared/composables/useFormRecords'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

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

const {
  form,
  submitting,
  handleSubmit: _submit,
} = useApplicationForm({
  emptyForm,
  requiredFields: ['activityName', 'location', 'organization', 'startDate', 'endDate', 'semester'],
  type: 'socialPractice',
  typeLabel: '社会实践',
})
const { clearDraft } = useFormDraft('social-practice', form)
const { records, addRecord, updateRecord, removeRecord } = useFormRecords('socialPractice')

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
  const name = form.activityName || '新记录'
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
  form.activityName = row.activityName || ''
  form.location = row.location || ''
  form.organization = row.organization || ''
  form.startDate = row.startDate || ''
  form.endDate = row.endDate || ''
  form.volunteerHours = row.volunteerHours ?? 0
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
    alert-title="社会实践申报说明"
    alert-description="请填写社会实践活动信息，并上传实践证明等佐证材料。"
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
