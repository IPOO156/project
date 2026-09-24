<script setup lang="ts">
import type { TeacherCareerPlanDetail } from '@/shared/types/teacher'
/**
 * CareerPlanDialog - 职业规划详情 + 教师反馈（教师端）
 * 数据：GET /teacher/students/{userId}/career-plans/{planId}
 * 提交：POST /teacher/career-plans/{planId}/feedbacks
 */
import { ElMessage } from 'element-plus'
import { MessageSquarePlus, XCircle } from 'lucide-vue-next'
import { computed, reactive, ref, watch } from 'vue'

import { submitTeacherCareerFeedback } from '@/shared/api/teacher'

const props = defineProps<{
  modelValue: boolean
  plan: TeacherCareerPlanDetail | null
  loading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const feedbackForm = reactive({ feedbackContent: '' })
const submitting = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (v) feedbackForm.feedbackContent = ''
  },
)

async function handleSubmit() {
  if (!props.plan) return
  if (!feedbackForm.feedbackContent.trim()) {
    ElMessage.warning('请填写反馈内容')
    return
  }
  if (feedbackForm.feedbackContent.trim().length > 2000) {
    ElMessage.warning('反馈内容不超过 2000 字')
    return
  }
  submitting.value = true
  try {
    await submitTeacherCareerFeedback(props.plan.id, {
      feedbackContent: feedbackForm.feedbackContent.trim(),
    })
    ElMessage.success('反馈已提交')
    emit('submitted')
  } catch {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="职业规划详情" width="640px" destroy-on-close>
    <div v-loading="loading" class="cpd" min-height="200">
      <template v-if="plan">
        <div class="cpd__head">
          <h4 class="cpd__title">{{ plan.title }}</h4>
          <el-tag
            :type="plan.status === 2 ? 'success' : plan.status === 3 ? 'danger' : 'warning'"
            size="small"
          >
            {{ plan.statusLabel }}
          </el-tag>
        </div>
        <p class="cpd__meta">{{ plan.semesterName || '' }}</p>
        <div class="cpd__progress-row">
          <span class="cpd__progress-label">完成进度</span>
          <el-progress
            :percentage="Math.max(0, Math.min(100, plan.progressRate ?? 0))"
            :stroke-width="8"
            class="cpd__progress"
          />
        </div>
        <div v-if="plan.rejectedReason" class="cpd__reject">
          <XCircle :size="14" />
          <span>退回原因：{{ plan.rejectedReason }}</span>
        </div>
        <div v-if="plan.content" class="cpd__section">
          <p class="cpd__section-title">规划内容</p>
          <p class="cpd__text">{{ plan.content }}</p>
        </div>
        <div v-if="plan.requirement" class="cpd__section">
          <p class="cpd__section-title">规划要求</p>
          <p class="cpd__text">{{ plan.requirement }}</p>
        </div>

        <div class="cpd__section">
          <p class="cpd__section-title">教师反馈</p>
          <div v-if="plan.feedbacks?.length" class="cpd__feedback-list">
            <div v-for="f in plan.feedbacks" :key="f.id" class="cpd__feedback-item">
              <div class="cpd__feedback-head">
                <span class="cpd__feedback-name">{{ f.teacherName ?? '教师' }}</span>
                <span class="cpd__feedback-time">{{ f.createdAt }}</span>
              </div>
              <p class="cpd__feedback-text">{{ f.feedbackContent }}</p>
            </div>
          </div>
          <div v-else class="cpd__feedback-empty">暂无教师反馈</div>
        </div>

        <el-divider class="cpd__divider" />
        <div class="cpd__form">
          <p class="cpd__form-title">
            <MessageSquarePlus :size="14" />
            添加反馈
          </p>
          <el-input
            v-model="feedbackForm.feedbackContent"
            type="textarea"
            :rows="3"
            maxlength="2000"
            show-word-limit
            placeholder="填写对这份职业规划的评价与建议…"
          />
          <div class="cpd__form-actions">
            <el-button :loading="submitting" type="primary" @click="handleSubmit"
              >提交反馈</el-button
            >
          </div>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="规划详情加载失败" :image-size="72" />
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.cpd {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    margin-bottom: 4px;
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__meta {
    margin: 0 0 $spacing-md;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__progress-row {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__progress-label {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__progress {
    flex: 1;
  }

  &__reject {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: $spacing-sm $spacing-md;
    margin-bottom: $spacing-md;
    border-radius: $radius-base;
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    font-size: 13px;
  }

  &__section {
    margin-bottom: $spacing-md;
  }

  &__section-title {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
  }

  &__text {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
  }

  &__feedback-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    max-height: 220px;
    overflow-y: auto;
  }

  &__feedback-item {
    padding: $spacing-sm $spacing-md;
    border-radius: $radius-base;
    background: var(--el-fill-color-light);
  }

  &__feedback-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  &__feedback-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  &__feedback-time {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  &__feedback-text {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-primary);
  }

  &__feedback-empty {
    padding: $spacing-lg;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-placeholder);
    border: 1px dashed var(--el-border-color-light);
    border-radius: $radius-base;
  }

  &__divider {
    margin: $spacing-md 0;
  }

  &__form-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 $spacing-sm;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: $spacing-md;
  }
}
</style>
