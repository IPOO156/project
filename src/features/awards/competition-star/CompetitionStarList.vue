<script setup lang="ts">
import type { FormRecord } from '@/shared/composables/useFormRecords'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive } from 'vue'
import { useApplicationPage } from '@/shared/composables/useApplicationPage'
import { useFirstLoadStagger } from '@/shared/composables/useFirstLoadStagger'
import { useRemoteDict } from '@/shared/composables/useRemoteDict'
import { useSemesters } from '@/shared/composables/useSemesters'
import { AWARD_LEVELS, COMPETITION_LEVELS, ROLE_OPTIONS } from '@/shared/constants/dict'
import ApplicationExtendedFields from '@/shared/ui/ApplicationExtendedFields.vue'
import ApplicationFormRecord from '@/shared/ui/ApplicationFormRecord.vue'
import CorrectionDialog from '@/shared/ui/CorrectionDialog.vue'
import ProofUpload from '@/shared/ui/ProofUpload.vue'
import RecordDetailDialog from '@/shared/ui/RecordDetailDialog.vue'
import ScoreIndicatorDialog from '@/shared/ui/ScoreIndicatorDialog.vue'

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

/** 必填进度：空串 / 空数组均视为未填，与提交校验口径一致 */
const requiredProgress = computed(() => {
  const missing = REQUIRED_FIELDS.filter((f) => {
    const value = (page.form as Record<string, unknown>)[f.key]
    if (Array.isArray(value)) return value.length === 0
    return value === undefined || value === null || value === ''
  }).map((f) => f.label)
  const done = REQUIRED_FIELDS.length - missing.length
  return {
    done,
    total: REQUIRED_FIELDS.length,
    percent: Math.round((done / REQUIRED_FIELDS.length) * 100),
    missing,
  }
})

/** 下拉码值 → 界面文案；字典未命中时原样展示，避免预览出现空白 */
function optionLabel(options: readonly { label: string; value: string }[], value?: string) {
  if (!value) return ''
  return options.find((item) => item.value === value)?.label ?? value
}

/** 实时预览：只列已填字段，未填项不占位 */
const previewItems = computed(() =>
  [
    { label: '学期', value: page.form.semester },
    { label: '竞赛', value: page.form.competitionName },
    { label: '时间', value: page.form.competitionDate },
    {
      label: '级别',
      value: optionLabel(competitionLevelOptions.value, page.form.competitionLevel),
    },
    { label: '获奖', value: optionLabel(awardLevelOptions.value, page.form.awardLevel) },
    { label: '角色', value: optionLabel(ROLE_OPTIONS, page.extendedForm.role) },
    { label: '证书编号', value: page.extendedForm.certNumber },
    { label: '发证单位', value: page.extendedForm.issuingAuthority },
    { label: '有效期', value: page.extendedForm.validityPeriod },
  ].filter((item) => Boolean(item.value)),
)

function handleEditClick(row: any) {
  page.form.competitionName = row.competitionName || ''
  page.form.competitionDate = row.competitionDate || ''
  page.form.competitionLevel = row.competitionLevel || ''
  page.form.awardLevel = row.awardLevel || ''
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
        <div class="star-layout">
          <el-form class="star-form" :model="page.form" label-width="120px">
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

          <aside class="star-side" aria-label="填写辅助">
            <section class="side-card">
              <h3 class="side-card__title">填写进度</h3>
              <div class="side-progress">
                <b>{{ requiredProgress.done }}</b>
                <span>/ {{ requiredProgress.total }} 项必填</span>
              </div>
              <div class="side-progress__bar">
                <i :style="{ width: `${requiredProgress.percent}%` }"></i>
              </div>
              <p class="side-muted">
                {{
                  requiredProgress.missing.length
                    ? `还差：${requiredProgress.missing.join('、')}`
                    : '必填项已完成，可以提交'
                }}
              </p>
            </section>

            <section class="side-card">
              <h3 class="side-card__title">实时预览</h3>
              <ul v-if="previewItems.length" class="side-preview">
                <li v-for="item in previewItems" :key="item.label">
                  <span>{{ item.label }}</span
                  ><b>{{ item.value }}</b>
                </li>
              </ul>
              <p v-else class="side-muted">填写后这里会同步显示摘要</p>
            </section>

            <section class="side-card">
              <h3 class="side-card__title">填写指引</h3>
              <ul class="side-list">
                <li>先选学期再填参赛时间；切换学期会清空已选时间。</li>
                <li>竞赛名称按获奖证书上的全称填写，便于与证书核对。</li>
                <li>竞赛级别、获奖级别以证书落款为准。</li>
                <li>证书编号、发证单位、有效期选填；长期有效可留空。</li>
                <li>佐证材料必传，支持 JPG / PNG / PDF，单文件不超过 10MB。</li>
              </ul>
            </section>

            <section class="side-card">
              <h3 class="side-card__title">常见退回原因</h3>
              <ul class="side-list">
                <li>六项必填有缺项，提交时会提示「请填写必填项」。</li>
                <li>参赛时间晚于所选学期的结束日期。</li>
                <li>切换学期后参赛时间被清空，未重新填写。</li>
                <li>佐证材料未上传，或格式、大小不符合上传限制。</li>
                <li>与已有记录重复，提交前的查重检测会拦截。</li>
              </ul>
            </section>
          </aside>
        </div>
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

/* 左表单 + 右辅助栏：桌面 1440 基准，表单铺满剩余宽度，右栏固定 320 */
.star-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.star-form {
  min-width: 0;

  /* 覆盖共享容器给控件写死的 480px，宽度交给栅格 */
  :deep(.el-form-item .el-input),
  :deep(.el-form-item .el-select),
  :deep(.el-form-item .el-date-editor),
  :deep(.el-form-item .el-textarea) {
    width: 100%;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.star-side {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);

  &__title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--el-text-color-primary);
  }
}

.side-progress {
  display: flex;
  align-items: baseline;
  gap: 4px;

  b {
    font-size: 22px;
    line-height: 1.1;
    color: var(--el-color-primary);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__bar {
    height: 6px;
    margin: 8px 0 6px;
    border-radius: 3px;
    background: var(--el-fill-color);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--el-color-primary);
      transition: width 0.24s ease;
    }
  }
}

.side-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    line-height: 1.5;
  }

  span {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);
  }

  b {
    min-width: 0;
    font-weight: 500;
    color: var(--el-text-color-primary);
    text-align: right;
    word-break: break-all;
  }
}

.side-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.side-muted {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

@media (max-width: 900px) {
  .star-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .star-side {
    position: static;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .star-side {
    grid-template-columns: minmax(0, 1fr);
  }

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
