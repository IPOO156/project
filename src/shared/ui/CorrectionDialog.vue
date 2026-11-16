<script setup lang="ts">
import type { CorrectionForm } from '@/shared/composables/useCorrection'
import { ElMessage } from 'element-plus'
import { ArrowRight, Plus, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useSemesters } from '@/shared/composables/useSemesters'
import {
  AWARD_LEVELS,
  CERTIFICATE_TYPES,
  COMPANY_TYPE_DISPLAY_OPTIONS,
  COMPETITION_LEVELS,
  COMPETITION_TYPE_DISPLAY_OPTIONS,
  COMPETITION_TYPES,
  INDUSTRY_TYPE_DISPLAY_OPTIONS,
  INDUSTRY_TYPES,
  INNOVATION_COMPANY_TYPES,
  ORGANIZATION_LEVEL_DISPLAY_OPTIONS,
  ORGANIZATION_LEVELS,
  PROJECT_LEVELS,
  RESEARCH_TYPE_DISPLAY_OPTIONS,
  RESEARCH_TYPES,
  ROLE_OPTIONS,
  SCHOLARSHIP_GRADES,
  SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS,
  SCHOLARSHIP_LEVELS,
} from '@/shared/constants/dict'
import { FIELD_LABELS } from '@/shared/constants/fieldLabels'

/**
 * CorrectionDialog - 纠错弹窗
 *
 * 允许学生提交已通过申报的修改申请，包含修改原因和变更字段。
 * 配合 useCorrection composable 使用。
 */
interface Props {
  visible: boolean
  submitting: boolean
  form: CorrectionForm
  recordTitle?: string
  /** 纠错前的记录快照：用于列出可修改字段（字段名 → 中文标签） */
  originalRecord?: Record<string, any> | null
}

const props = withDefaults(defineProps<Props>(), {
  recordTitle: '',
  originalRecord: null,
})

const emit = defineEmits<{
  close: []
  submit: []
  'update:visible': [visible: boolean]
  'update:form': [field: string, value: string]
  removeField: [field: string]
}>()

/** 不作为可修改候选的展示型字段 */
const READONLY_FIELDS = new Set([
  'title',
  'typeLabel',
  'submitDate',
  'submitTime',
  'status',
  'rejectedReason',
  'proofMaterials',
])

const draftField = ref('')
const draftValue = ref('')

/** 枚举字段的可选项（canonical 码，供编辑） */
const FIELD_SELECT_OPTIONS: Record<string, readonly { label: string; value: string }[]> = {
  competitionType: COMPETITION_TYPES,
  competitionLevel: COMPETITION_LEVELS,
  awardLevel: AWARD_LEVELS,
  projectLevel: PROJECT_LEVELS,
  researchType: RESEARCH_TYPES,
  organizationLevel: ORGANIZATION_LEVELS,
  industryType: INDUSTRY_TYPES,
  companyType: INNOVATION_COMPANY_TYPES,
  scholarshipLevel: SCHOLARSHIP_LEVELS,
  scholarshipGrade: SCHOLARSHIP_GRADES,
  certType: CERTIFICATE_TYPES,
  role: ROLE_OPTIONS,
}

/** 码 → 中文（含历史码），用于变更前后对比展示 */
const FIELD_DISPLAY_OPTIONS: Record<string, readonly { label: string; value: string }[]> = {
  competitionType: COMPETITION_TYPE_DISPLAY_OPTIONS,
  researchType: RESEARCH_TYPE_DISPLAY_OPTIONS,
  organizationLevel: ORGANIZATION_LEVEL_DISPLAY_OPTIONS,
  industryType: INDUSTRY_TYPE_DISPLAY_OPTIONS,
  companyType: COMPANY_TYPE_DISPLAY_OPTIONS,
  scholarshipLevel: SCHOLARSHIP_LEVEL_DISPLAY_OPTIONS,
  competitionLevel: COMPETITION_LEVELS,
  awardLevel: AWARD_LEVELS,
  projectLevel: PROJECT_LEVELS,
  scholarshipGrade: SCHOLARSHIP_GRADES,
  certType: CERTIFICATE_TYPES,
  role: ROLE_OPTIONS,
}

const { semesterOptions, load: loadSemesters } = useSemesters()

/** 可修改字段：快照里有值、且不在只读白名单、且还没被加入变更项 */
const fieldOptions = computed(() => {
  const record = props.originalRecord || {}
  const changed = props.form.changedFields
  return Object.keys(FIELD_LABELS)
    .filter((key) => {
      if (READONLY_FIELDS.has(key) || key in changed) return false
      const value = record[key]
      return typeof value === 'string' || typeof value === 'number'
    })
    .map((key) => ({ value: key, label: FIELD_LABELS[key] }))
})

/** 日期字段用日期选择器，其余用文本输入 */
const draftIsDate = computed(() => /(?:Date|Time)$/.test(draftField.value))

/** 当前所选字段的下拉选项：学期取真实学期列表，其余枚举取字典常量 */
const draftSelectOptions = computed<readonly { label: string; value: string }[]>(() => {
  if (draftField.value === 'semester') return semesterOptions.value
  return FIELD_SELECT_OPTIONS[draftField.value] ?? []
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      draftField.value = ''
      draftValue.value = ''
      return
    }
    void loadSemesters()
  },
)

watch(draftField, () => {
  draftValue.value = ''
})

function labelOf(field: string) {
  return FIELD_LABELS[field] || field
}

/** 变更前后展示：枚举码翻译成中文，未命中原样展示 */
function displayOf(field: string, value: any) {
  if (value === undefined || value === null || value === '') return '(空)'
  const options = FIELD_DISPLAY_OPTIONS[field]
  if (!options) return String(value)
  return options.find((o) => o.value === String(value))?.label ?? String(value)
}

function addChange() {
  if (!draftField.value) {
    ElMessage.warning('请选择要修改的字段')
    return
  }
  if (draftValue.value === '' || draftValue.value === undefined || draftValue.value === null) {
    ElMessage.warning('请填写或选择修改后的内容')
    return
  }
  emit('update:form', draftField.value, draftValue.value)
  draftField.value = ''
  draftValue.value = ''
}

/**
 * 提交前把「已选字段 + 已填新值」但还没点「添加」的草稿一并纳入，
 * 避免用户选完字段直接点提交时被提示「请选择要修改的字段」。
 */
function handleSubmit() {
  if (draftField.value && (draftValue.value === '' || draftValue.value == null)) {
    ElMessage.warning('请填写或选择修改后的内容')
    return
  }
  if (draftField.value && draftValue.value !== '' && draftValue.value != null) {
    emit('update:form', draftField.value, draftValue.value)
    draftField.value = ''
    draftValue.value = ''
  }
  emit('submit')
}

function handleBeforeClose(done: (cancel?: boolean) => void) {
  handleCancel()
  done()
}

function handleCancel() {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="提交修改申请"
    width="560px"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
  >
    <div class="correction-dialog">
      <el-alert
        title="修改说明"
        type="warning"
        description="提交修改申请后，需等待审核通过才能生效。请如实填写修改原因和变更内容。"
        :closable="false"
        show-icon
        class="correction-dialog__alert"
      />

      <el-form v-if="visible" label-position="top" class="correction-dialog__form">
        <el-form-item label="修改记录">
          <el-tag type="info" effect="plain">{{ recordTitle || '当前记录' }}</el-tag>
        </el-form-item>

        <el-form-item label="修改原因" required>
          <el-input
            :model-value="form.reason"
            type="textarea"
            :rows="3"
            placeholder="请详细说明修改原因"
            maxlength="500"
            show-word-limit
            @input="emit('update:form', 'reason', $event)"
          />
        </el-form-item>

        <el-form-item label="变更字段">
          <div class="correction-dialog__editor">
            <el-select
              v-model="draftField"
              placeholder="选择要修改的字段"
              class="correction-dialog__select"
              filterable
            >
              <el-option
                v-for="opt in fieldOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-select
              v-if="draftSelectOptions.length"
              v-model="draftValue"
              placeholder="选择修改后的值"
              filterable
              class="correction-dialog__value"
            >
              <el-option
                v-for="opt in draftSelectOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-date-picker
              v-else-if="draftIsDate"
              v-model="draftValue"
              type="date"
              placeholder="修改后的日期"
              value-format="YYYY-MM-DD"
              class="correction-dialog__value"
            />
            <el-input
              v-else
              v-model="draftValue"
              placeholder="修改后的内容"
              class="correction-dialog__value"
            />
            <el-button type="primary" plain :disabled="!draftField" @click="addChange">
              <Plus :size="14" />
              添加
            </el-button>
          </div>

          <div v-if="Object.keys(form.changedFields).length === 0" class="correction-dialog__empty">
            暂无变更字段：选择字段并填写新值后点「添加」，或直接点下方「提交修改申请」
          </div>
          <div
            v-for="(change, field) in form.changedFields"
            :key="field"
            class="correction-dialog__change"
          >
            <div class="correction-dialog__change-head">
              <span class="correction-dialog__field">{{ labelOf(field) }}</span>
              <el-button link type="danger" @click="emit('removeField', field)">
                <X :size="14" />
              </el-button>
            </div>
            <span class="correction-dialog__arrow">
              <span class="correction-dialog__old">{{ displayOf(field, change.old) }}</span>
              <ArrowRight :size="14" />
              <span class="correction-dialog__new">{{ displayOf(field, change.new) }}</span>
            </span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        提交修改申请
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.correction-dialog {
  &__alert {
    margin-bottom: 20px;
  }

  &__form {
    :deep(.el-form-item__label) {
      font-weight: 600;
    }
  }

  &__editor {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  &__select {
    width: 150px;
    flex: none;
  }

  &__value {
    flex: 1;
    min-width: 0;
  }

  &__empty {
    color: #909399;
    font-size: 13px;
    padding: 8px 0;
  }

  &__change {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 8px;
    width: 100%;
  }

  // 夜间模式适配：变更对比框降为填充层深色
  html.dark &__change {
    background: #1e293b;
  }

  &__change-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__field {
    font-weight: 600;
    font-size: 13px;
    color: #409eff;
  }

  &__arrow {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  &__old {
    color: #f56c6c;
    text-decoration: line-through;
  }

  &__new {
    color: #67c23a;
    font-weight: 500;
  }
}
</style>
