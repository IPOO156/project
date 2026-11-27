<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useFirstLoadStagger } from '@/shared/composables/useFirstLoadStagger'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { AWARD_LEVELS, COMPETITION_LEVELS, ROLE_OPTIONS } from '@/shared/constants/dict'
import ApplicationExtendedFields from '@/shared/ui/ApplicationExtendedFields.vue'
import ApplicationFormLayout from '@/shared/ui/ApplicationFormLayout.vue'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import RecordDetailDialog from '@/shared/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'
import { asText } from '@/shared/utils/unknown'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 竞赛级别 / 获奖级别：后端字典优先，常量兜底 */
const { options: competitionLevelOptions, load: loadCompetitionLevels } = useRemoteDict(
  'competition_level',
  COMPETITION_LEVELS,
)
const { options: awardLevelOptions, load: loadAwardLevels } = useRemoteDict(
  'award_level',
  AWARD_LEVELS,
)

function emptyForm() {
  return {
    semester: '',
    competitionName: '',
    competitionDate: '',
    competitionLevel: '',
    awardLevel: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份清单，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'semester', label: '学期' },
  { key: 'competitionName', label: '竞赛名称' },
  { key: 'competitionDate', label: '参赛时间' },
  { key: 'competitionLevel', label: '竞赛级别' },
  { key: 'awardLevel', label: '获奖级别' },
  { key: 'proofMaterials', label: '佐证材料' },
] as const

const page = reactive(
  useApplicationPage(
    'competitionStar',
    '竞赛之星报名',
    emptyForm,
    'competition-star',
    [...REQUIRED_FIELDS],
    { monthField: 'competitionDate', monthFieldLabel: '参赛时间' },
  ),
)

const staggerActive = useFirstLoadStagger(() => page.records.length)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'semester', label: '学期' },
  { key: 'competitionName', label: '竞赛' },
  { key: 'competitionDate', label: '时间' },
  { key: 'competitionLevel', label: '级别', options: competitionLevelOptions },
  { key: 'awardLevel', label: '获奖', options: awardLevelOptions },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '先选学期再填参赛时间；切换学期会清空已选时间。',
  '竞赛名称按获奖证书上的全称填写，便于与证书核对。',
  '竞赛级别、获奖级别以证书落款为准。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '六项必填有缺项，提交时会提示「请填写必填项」。',
  '参赛时间晚于所选学期的结束日期。',
  '切换学期后参赛时间被清空，未重新填写。',
  '佐证材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

function handleEditClick(row: Record<string, unknown>) {
  page.form.competitionName = asText(row.competitionName)
  page.form.competitionDate = asText(row.competitionDate)
  page.form.competitionLevel = asText(row.competitionLevel)
  page.form.awardLevel = asText(row.awardLevel)
  page.form.semester = asText(row.semester)
  page.handleEditClick(row)
}

async function handleRemove(row: { id: string }) {
  try {
    await ElMessageBox.confirm('确定删除该记录吗？删除后不可恢复。', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await page.removeRecord(row.id)
    ElMessage.success('已删除')
  } catch {
    /* cancel */
  }
}

onMounted(() => {
  page.init()
  loadSemesters()
  void loadCompetitionLevels()
  void loadAwardLevels()
})
</script>

<template>
  <div class="award-page">
    <!-- 单根节点（且根前不能有顶层注释）：DefaultLayout 的路由 <Transition mode="out-in">
         只接受单根可动画组件，多根=Fragment 时离开后不会重置 isLeaving，
         后续所有页面都渲染为空，必须刷新才能恢复。 -->
    <ApplicationFormRecord
      class="page-enter"
      :class="{ 'is-stagger-armed': staggerActive }"
      alert-title="竞赛之星报名说明"
      alert-description="竞赛之星用于评选在学科竞赛中表现突出的同学。请填写参赛信息及获奖情况，提交后可在下方查看报名记录。"
      :show-records="true"
      :records="page.records"
      :submitting="page.submitting"
      :saving="page.draftSaving"
      :is-editing="page.isEditing"
      :status="page.currentStatus"
      :rejection-reason="page.rejectionReason"
      :enrollment-info="page.enrollmentInfo"
      @save-draft="page.handleSaveDraft"
      @submit="page.handleSubmit"
      @view="(row: FormRecord) => page.viewRecord(row)"
      @edit="(row: FormRecord) => handleEditClick(row)"
      @remove="(row: FormRecord) => handleRemove(row)"
      @cancel="page.handleCancel"
      @withdraw="(row: FormRecord) => page.handleWithdraw(row)"
      @correction="(row: FormRecord) => page.handleCorrection(row)"
      @score="(row: FormRecord) => page.handleViewScore(row)"
    >
      <template #form>
        <ApplicationFormLayout
          :required-fields="REQUIRED_FIELDS"
          :form="page.form"
          :preview-fields="PREVIEW_FIELDS"
          :extended-form="page.extendedForm"
          :guide-items="GUIDE_ITEMS"
          :reject-items="REJECT_ITEMS"
        >
          <el-form :model="page.form" label-width="120px">
            <el-form-item label="学期" required>
              <el-select v-model="page.form.semester" placeholder="选择学期（如 2025-2026-1）">
                <el-option
                  v-for="s in semesterOptions"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="竞赛名称" required
              ><el-input
                v-model="page.form.competitionName"
                placeholder="例：2025 年全国大学生数学建模竞赛"
            /></el-form-item>
            <el-form-item label="参赛时间" required>
              <el-date-picker
                v-model="page.form.competitionDate"
                type="month"
                format="YYYY-MM"
                value-format="YYYY-MM"
                placeholder="例：2025-09（按证书上的参赛月份）"
                :disabled-date="page.disabledDate"
              />
            </el-form-item>
            <el-form-item label="竞赛级别" required>
              <el-select
                v-model="page.form.competitionLevel"
                placeholder="选择赛事层级（如 国家级）"
              >
                <el-option
                  v-for="t in competitionLevelOptions"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="获奖级别" required>
              <el-select v-model="page.form.awardLevel" placeholder="例：一等奖（以证书为准）">
                <el-option
                  v-for="t in awardLevelOptions"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <ApplicationExtendedFields
              :form="page.extendedForm"
              :hidden="['acquisitionDate']"
              @update="
                (field: string, val: string) => {
                  ;(page.extendedForm as Record<string, string>)[field] = val
                }
              "
            />
            <el-form-item label="佐证材料" required>
              <ProofUpload
                v-model:file-list="page.form.proofMaterials"
                :status="page.currentStatus"
              />
            </el-form-item>
          </el-form>
        </ApplicationFormLayout>
      </template>
      <template #columns>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="submitDate" label="提交日期" width="120" />
      </template>
    </ApplicationFormRecord>

    <CorrectionDialog
      :visible="page.correctionVisible"
      :submitting="page.correctionSubmitting"
      :original-record="page.originalSnapshot"
      :form="page.correctionForm"
      @update:visible="
        (v: boolean) => {
          if (!v) page.closeCorrection()
        }
      "
      @update:form="(field: string, val: string) => page.setChangedField(field, val)"
      @remove-field="page.removeChangedField"
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
  </div>
</template>

<style scoped lang="scss">
.page-enter {
  @include page-enter;
}

.page-enter.is-stagger-armed {
  --mc-row-duration: 0.32s;
  --mc-row-delay: 0.04s;
  --mc-row-offset: 60px;
  --mc-row-easing: #{$ease-out-cubic};

  @include table-row-staggered(20);
}

@media (max-width: 720px) {
  :deep(.form-actions) {
    position: sticky;
    bottom: 0;
    z-index: 2;
    margin-top: 0;
    padding: 10px 0;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

:deep(.page-container) {
  user-select: none;
}
</style>
