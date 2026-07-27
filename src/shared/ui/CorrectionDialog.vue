<script setup lang="ts">
import type { CorrectionForm } from '@/shared/composables/useCorrection'
/**
 * CorrectionDialog - 纠错弹窗
 *
 * 允许学生提交已通过申报的修改申请，包含修改原因和变更字段。
 * 配合 useCorrection composable 使用。
 */
import { ArrowRight } from 'lucide-vue-next'

interface Props {
  visible: boolean
  submitting: boolean
  form: CorrectionForm
  recordTitle?: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  submit: []
  'update:field': [field: string, value: any]
}>()

function handleFieldChange(field: string, value: any) {
  emit('update:field', field, value)
}

function handleSubmit() {
  emit('submit')
}

function handleBeforeClose(done: (cancel?: boolean) => void) {
  emit('close')
  done()
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="提交修改申请"
    width="520px"
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
            @input="handleFieldChange('reason', $event)"
          />
        </el-form-item>

        <el-form-item label="变更字段">
          <div v-if="Object.keys(form.changedFields).length === 0" class="correction-dialog__empty">
            暂无变更字段
          </div>
          <div
            v-for="(change, field, index) in form.changedFields"
            :key="index"
            class="correction-dialog__change"
          >
            <span class="correction-dialog__field">{{ field }}</span>
            <span class="correction-dialog__arrow">
              <span class="correction-dialog__old">{{ change.old ?? '(空)' }}</span>
              <ArrowRight :size="14" />
              <span class="correction-dialog__new">{{ change.new ?? '(空)' }}</span>
            </span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button :disabled="submitting" @click="emit('close')">取消</el-button>
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
