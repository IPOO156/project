<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { INNOVATION_COMPANY_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import RecordDetailDialog from '@/shared/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'

function emptyForm() {
  return {
    companyName: '',
    industryType: '',
    companyType: '',
    teamRole: '',
    registerDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const page = reactive(
  useApplicationPage('innovation', '创新创业', emptyForm, undefined, [
    { key: 'companyName', label: '公司名称' },
    { key: 'industryType', label: '行业类型' },
    { key: 'companyType', label: '公司类型' },
    { key: 'teamRole', label: '团队角色' },
    { key: 'registerDate', label: '注册时间' },
    { key: 'semester', label: '学期' },
  ]),
)

function handleEditClick(row: any) {
  page.form.companyName = row.companyName || ''
  page.form.industryType = row.industryType || ''
  page.form.companyType = row.companyType || ''
  page.form.teamRole = row.teamRole || ''
  page.form.registerDate = row.registerDate || ''
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
    alert-title="创新创业申报说明"
    alert-description="请填写创新创业项目或企业相关信息，并上传营业执照、项目计划书等佐证材料。"
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
        <el-form-item label="公司名称" required
          ><el-input v-model="page.form.companyName" placeholder="请输入公司名称"
        /></el-form-item>
        <el-form-item label="行业类型" required
          ><el-input v-model="page.form.industryType" placeholder="请输入行业类型"
        /></el-form-item>
        <el-form-item label="公司类型" required>
          <el-select v-model="page.form.companyType" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in INNOVATION_COMPANY_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="团队角色" required
          ><el-input v-model="page.form.teamRole" placeholder="请输入团队角色"
        /></el-form-item>
        <el-form-item label="注册时间" required
          ><el-date-picker v-model="page.form.registerDate" type="date" placeholder="选择日期"
        /></el-form-item>
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
          <ProofUpload
            v-model:file-list="page.form.proofMaterials"
            :status="page.currentStatus"
            tip="支持 pdf、doc、docx 格式"
          />
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
  <RecordDetailDialog
    :visible="page.detailVisible"
    :record="page.detailRecord"
    :loading="page.detailLoading"
    @update:visible="
      (v) => {
        if (!v) page.closeDetail()
      }
    "
    @close="page.closeDetail"
  />
</template>

<style scoped lang="scss">
.form-select {
  width: 200px;
}
:deep(.page-container) {
  user-select: none;
}
</style>
