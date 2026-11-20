<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useFirstLoadStagger } from '@/shared/composables/useFirstLoadStagger'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { INDUSTRY_TYPES, ROLE_OPTIONS } from '@/shared/constants/dict'
import ApplicationExtendedFields from '@/shared/ui/ApplicationExtendedFields.vue'
import ApplicationFormLayout from '@/shared/ui/ApplicationFormLayout.vue'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import RecordDetailDialog from '@/shared/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 行业类型：后端字典优先，常量兜底 */
const { options: industryTypeOptions, load: loadIndustryTypes } = useRemoteDict(
  'industry_type',
  INDUSTRY_TYPES,
)

function emptyForm() {
  return {
    companyName: '',
    semester: '',
    industryType: '',
    ranking: '',
    registerDate: '',
    proofMaterials: [] as string[],
  }
}

/** 必填项：与 useApplicationPage 提交校验共用同一份，右栏进度据此计算 */
const REQUIRED_FIELDS = [
  { key: 'companyName', label: '公司名称' },
  { key: 'semester', label: '学期' },
  { key: 'industryType', label: '行业类型' },
  { key: 'ranking', label: '申报人排名' },
  { key: 'registerDate', label: '注册时间' },
  { key: 'proofMaterials', label: '证明材料' },
] as const

const page = reactive(
  useApplicationPage(
    'innovationStar',
    '双创之星报名',
    emptyForm,
    'innovation-star',
    [...REQUIRED_FIELDS],
    { monthField: 'registerDate', monthFieldLabel: '注册时间' },
  ),
)

/** 实时预览字段：码值用下拉同源映射转文案 */
const PREVIEW_FIELDS = [
  { key: 'companyName', label: '公司' },
  { key: 'semester', label: '学期' },
  { key: 'industryType', label: '行业', options: industryTypeOptions },
  { key: 'ranking', label: '排名' },
  { key: 'registerDate', label: '注册时间' },
  { key: 'role', label: '角色', options: ROLE_OPTIONS, source: 'extended' as const },
  { key: 'certNumber', label: '证书编号', source: 'extended' as const },
  { key: 'issuingAuthority', label: '发证单位', source: 'extended' as const },
  { key: 'validityPeriod', label: '有效期', source: 'extended' as const },
]

const GUIDE_ITEMS = [
  '先选学期再填注册时间；切换学期会清空与新学期的日期。',
  '公司名称按营业执照全称填写，便于核对。',
  '行业类型、申报人排名以企业实际信息为准。',
  '证书编号、发证单位、有效期选填；长期有效可留空。',
  '证明材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。',
]

const REJECT_ITEMS = [
  '六项必填有缺项，提交时会提示「请填写必填项」。',
  '注册时间晚于所选学期的结束日期。',
  '切换学期后注册时间被清空，未重新填写。',
  '证明材料未上传，或格式、大小不符合上传限制。',
  '与已有记录重复，提交前的查重检测会拦截。',
]

const staggerActive = useFirstLoadStagger(() => page.records.length)

function handleEditClick(row: any) {
  page.form.companyName = row.companyName || ''
  page.form.industryType = row.industryType || ''
  page.form.ranking = row.ranking || ''
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
    await page.removeRecord(row.id)
    ElMessage.success('已删除')
  } catch {
    /* cancel */
  }
}

onMounted(() => {
  page.init()
  loadSemesters()
  void loadIndustryTypes()
})
</script>

<template>
  <div class="award-page">
    <!-- 单根节点：DefaultLayout 的 <Transition mode="out-in"> 要求路由组件只有一个可动画根元素，
         否则离开动画结束后不再挂载新页面，返回本页时表现为整页空白（需刷新才恢复）。 -->
    <ApplicationFormRecord
      class="page-enter"
      :class="{ 'is-stagger-armed': staggerActive }"
      alert-title="双创之星报名说明"
      alert-description="双创之星用于评选在创新创业实践中表现突出的同学。请填写公司信息、行业类型、申报人排名及注册时间，提交后可在下方查看报名记录。"
      :show-records="true"
      :records="page.records"
      :submitting="page.submitting"
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
            <el-form-item label="公司名称" required
              ><el-input v-model="page.form.companyName" placeholder="例：杭州青禾智能科技有限公司"
            /></el-form-item>
            <el-form-item label="学期" required>
              <el-select
                v-model="page.form.semester"
                placeholder="选择学期（如 2025-2026-1）"
                class="form-select"
              >
                <el-option
                  v-for="s in semesterOptions"
                  :key="s.value"
                  :label="s.label"
                  :value="s.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="行业类型" required>
              <el-select
                v-model="page.form.industryType"
                placeholder="选择行业类型（如 信息技术）"
                class="form-select"
              >
                <el-option
                  v-for="t in industryTypeOptions"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="申报人排名" required>
              <el-input
                v-model="page.form.ranking"
                placeholder="例：1/3（本人排第 1）"
                class="form-input"
              />
            </el-form-item>
            <el-form-item label="注册时间" required>
              <el-date-picker
                v-model="page.form.registerDate"
                type="month"
                format="YYYY-MM"
                value-format="YYYY-MM"
                placeholder="例：2025-04"
                :disabled-date="page.disabledDate"
              />
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
            <el-form-item label="证明材料" required>
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

.form-select,
.form-input {
  width: 200px;
}
:deep(.page-container) {
  user-select: none;
}
</style>
