<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'

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

const page = reactive(
  useApplicationPage('socialPractice', '社会实践', emptyForm, 'social-practice', [
    { key: 'activityName', label: '活动名称' },
    { key: 'location', label: '活动地点' },
    { key: 'organization', label: '组织单位' },
    { key: 'startDate', label: '开始时间' },
    { key: 'endDate', label: '结束时间' },
    { key: 'semester', label: '学期' },
  ]),
)

function handleEditClick(row: any) {
  page.form.activityName = row.activityName || ''
  page.form.location = row.location || ''
  page.form.organization = row.organization || ''
  page.form.startDate = row.startDate || ''
  page.form.endDate = row.endDate || ''
  page.form.volunteerHours = row.volunteerHours ?? 0
  page.form.semester = row.semester || ''
  page.handleEditClick(row)
}

async function handleRemove(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？删除后不可恢复。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    page.removeRecord(row.id)
    ElMessage.success('已删除')
  } catch {
    /* cancel */
  }
}

onMounted(() => {
  page.init()
})
</script>

<template>
  <ApplicationFormRecord
    alert-title="社会实践申报说明"
    alert-description="请填写社会实践活动信息，并上传实践证明等佐证材料。"
    :show-records="true"
    :records="page.records"
    :submitting="page.submitting"
    :is-editing="page.isEditing"
    :status="page.currentStatus"
    :rejection-reason="page.rejectionReason"
    :enrollment-info="page.enrollmentInfo"
    :show-extended-fields="true"
    :extended-form="page.extendedForm"
    @update:extended-form="
      (field, val) => {
        ;(page.extendedForm as any)[field] = val
      }
    "
    @save-draft="page.handleSaveDraft"
    @submit="page.handleSubmit"
    @view="(row) => page.viewRecord(row)"
    @edit="(row) => handleEditClick(row)"
    @remove="(row) => handleRemove(row)"
    @cancel="page.handleCancel"
    @withdraw="(row) => page.handleWithdraw(row)"
    @correction="(row) => page.handleCorrection(row)"
    @score="(row) => page.handleViewScore(row)"
  >
    <template #form>
      <el-form :model="page.form" label-width="120px">
        <el-form-item label="活动名称" required
          ><el-input v-model="page.form.activityName" placeholder="请输入活动名称"
        /></el-form-item>
        <el-form-item label="活动地点" required
          ><el-input v-model="page.form.location" placeholder="请输入活动地点"
        /></el-form-item>
        <el-form-item label="组织单位" required
          ><el-input v-model="page.form.organization" placeholder="请输入组织单位"
        /></el-form-item>
        <el-form-item label="开始时间" required
          ><el-date-picker v-model="page.form.startDate" type="date" placeholder="选择日期"
        /></el-form-item>
        <el-form-item label="结束时间" required
          ><el-date-picker v-model="page.form.endDate" type="date" placeholder="选择日期"
        /></el-form-item>
        <el-form-item label="志愿时长">
          <el-input-number
            v-model="page.form.volunteerHours"
            :min="0"
            controls-position="right"
            class="form-input-number"
          />
        </el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="page.form.semester" placeholder="请选择" class="form-select">
            <el-option
              v-for="s in SEMESTER_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料">
          <ProofUpload v-model:file-list="page.form.proofMaterials" :status="page.currentStatus" />
        </el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="submitDate" label="提交日期" width="120" />
    </template>
  </ApplicationFormRecord>

  <CorrectionDialog
    :visible="page.correctionVisible"
    :submitting="page.correctionSubmitting"
    :original-record="page.originalSnapshot"
    :form="page.correctionForm"
    @update:visible="
      (v) => {
        if (!v) page.closeCorrection()
      }
    "
    @update:form="(field, val) => page.setChangedField(field, val)"
    @submit="page.submitCorrection"
  />
  <ScoreIndicatorDialog
    :visible="page.indicatorVisible"
    :loading="page.indicatorLoading"
    :title="page.indicatorTitle"
    :indicators="page.indicators"
    @close="page.closeIndicator"
  />
</template>

<style scoped lang="scss">
.form-select {
  width: 200px;
}
.form-input-number {
  width: 200px;
}
:deep(.page-container) {
  user-select: none;
}
</style>
