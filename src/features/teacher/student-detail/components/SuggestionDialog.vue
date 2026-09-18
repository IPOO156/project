<script setup lang="ts">
/**
 * SuggestionDialog - 教师改进建议（教师端）
 * 提交：POST /teacher/students/{userId}/improvement-suggestions
 * 字段：weaknessId?（关联短板）、suggestionType（必填 ≤50）、content（必填 ≤2000）、relatedGoalId?
 */
import { ElMessage } from 'element-plus'
import { Lightbulb } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'

import { addTeacherImprovementSuggestion } from '@/shared/api/teacher'

const props = defineProps<{
  modelValue: boolean
  userId: number
  weaknessId?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const form = reactive({
  suggestionType: '',
  content: '',
  relatedGoalId: undefined as number | undefined,
})
const submitting = ref(false)

const SUGGESTION_TYPE_OPTIONS = ['学习计划', '时间管理', '能力提升', '职业发展', '心理建设', '其他']

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      form.suggestionType = ''
      form.content = ''
      form.relatedGoalId = undefined
    }
  },
)

async function handleSubmit() {
  if (!form.suggestionType.trim()) {
    ElMessage.warning('请填写建议类型')
    return
  }
  if (form.suggestionType.trim().length > 50) {
    ElMessage.warning('建议类型不超过 50 字')
    return
  }
  if (!form.content.trim()) {
    ElMessage.warning('请填写建议内容')
    return
  }
  if (form.content.trim().length > 2000) {
    ElMessage.warning('建议内容不超过 2000 字')
    return
  }
  submitting.value = true
  try {
    await addTeacherImprovementSuggestion(props.userId, {
      weaknessId: props.weaknessId,
      suggestionType: form.suggestionType.trim(),
      content: form.content.trim(),
      relatedGoalId: form.relatedGoalId,
    })
    ElMessage.success('改进建议已提交')
    emit('submitted')
  } catch {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="添加改进建议" width="520px" destroy-on-close>
    <div class="sug">
      <div v-if="weaknessId" class="sug__hint">
        <Lightbulb :size="14" />
        <span>该建议将关联到所选短板记录（ID: {{ weaknessId }}）</span>
      </div>
      <el-form label-width="90px" label-position="left">
        <el-form-item label="建议类型" required>
          <el-select
            v-model="form.suggestionType"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入建议类型"
            style="width: 100%"
          >
            <el-option v-for="t in SUGGESTION_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="建议内容" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            maxlength="2000"
            show-word-limit
            placeholder="填写针对该短板的具体改进建议…"
          />
        </el-form-item>
        <el-form-item label="关联目标">
          <el-input-number
            v-model="form.relatedGoalId"
            :min="1"
            placeholder="目标 ID（可选）"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交建议</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.sug {
  &__hint {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: $spacing-sm $spacing-md;
    margin-bottom: $spacing-md;
    border-radius: $radius-base;
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
    font-size: 13px;
  }
}
</style>
