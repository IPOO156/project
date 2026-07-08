<script setup lang="ts">
import { useApplicationForm } from '@/shared/composables/useApplicationForm'
import { useFormDraft } from '@/shared/composables/useFormDraft'
import { AWARD_LEVELS, COMPETITION_TYPES, SEMESTER_OPTIONS } from '@/shared/constants/dict'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'

function emptyForm() {
  return {
    competitionName: '',
    competitionType: '',
    awardLevel: '',
    awardDate: '',
    semester: '',
    proofMaterials: [] as string[],
  }
}

const { form, submitting, handleSubmit: _submit } = useApplicationForm({ emptyForm })
const { clearDraft } = useFormDraft('competition', form as Record<string, unknown>)

async function handleSubmit() {
  await _submit()
  clearDraft()
}
</script>

<template>
  <ApplicationFormRecord
    alert-title="学科竞赛申报说明"
    alert-description="请如实填写参与的学科竞赛信息，并上传相关佐证材料（获奖证书扫描件等）。材料经审核通过后将记入个人档案，作为评奖评优依据。"
    :show-records="false"
    :submitting="submitting"
    @submit="handleSubmit"
  >
    <template #form>
      <el-form :model="form" label-width="120px">
        <el-form-item label="竞赛名称" required
          ><el-input v-model="form.competitionName" placeholder="请输入竞赛名称"
        /></el-form-item>
        <el-form-item label="竞赛类型" required>
          <el-select v-model="form.competitionType" placeholder="请选择" class="form-select">
            <el-option
              v-for="t in COMPETITION_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖等级" required>
          <el-select v-model="form.awardLevel" placeholder="请选择" class="form-select">
            <el-option v-for="t in AWARD_LEVELS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="获奖时间" required
          ><el-date-picker v-model="form.awardDate" type="month" placeholder="选择年月"
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
  </ApplicationFormRecord>
</template>

<style scoped lang="scss">
:deep(.page-container) {
  user-select: none;
}
</style>
