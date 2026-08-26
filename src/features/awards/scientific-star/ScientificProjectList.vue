<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { PROJECT_LEVELS, ROLE_OPTIONS, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'

function emptyForm() {
  return {
    projectName: '',
    projectLevel: '',
    ranking: '',
    startDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const page = reactive(
  useApplicationPage('scientificProject', '科研项目', emptyForm, 'scientific-project', [
    { key: 'projectName', label: '项目名称' },
    { key: 'projectLevel', label: '项目级别' },
    { key: 'ranking', label: '排名/总人数' },
    { key: 'startDate', label: '立项时间' },
    { key: 'semester', label: '学期' },
  ]),
)

function handleEditClick(row: any) {
  page.form.projectName = row.projectName || ''
  page.form.projectLevel = row.projectLevel || ''
  page.form.ranking = row.ranking || ''
  page.form.startDate = row.startDate || ''
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
    alert-title="科研项目申报说明"
    alert-description="请填写科研项目信息。"
    :show-alert="false"
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
        <el-form-item label="项目名称" required
          ><el-input v-model="page.form.projectName"
        /></el-form-item>
        <el-form-item label="项目级别" required>
          <el-select v-model="page.form.projectLevel" class="form-select">
            <el-option
              v-for="t in PROJECT_LEVELS"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排名/总人数" required
          ><el-input v-model="page.form.ranking" placeholder="如：2/5"
        /></el-form-item>
        <el-form-item label="立项时间" required
          ><el-date-picker v-model="page.form.startDate" type="month"
        /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="page.form.semester" class="form-select">
            <el-option
              v-for="s in SEMESTER_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="佐证材料"
          ><ProofUpload v-model:file-list="page.form.proofMaterials" :status="page.currentStatus"
        /></el-form-item>
      </el-form>
    </template>
    <template #columns>
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="title" label="标题" min-width="180" />
      <el-table-column prop="role" label="本人角色" width="100">
        <template #default="{ row }">{{
          ROLE_OPTIONS.find((r) => r.value === row.role)?.label || '-'
        }}</template>
      </el-table-column>
      <el-table-column prop="submitDate" label="提交日期" width="110" />
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
:deep(.page-container) {
  user-select: none;
}
</style>
