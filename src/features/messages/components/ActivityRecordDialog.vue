<script setup lang="ts">
import type { Activity } from '@/shared/types/types'
import { CheckCircle2, X } from 'lucide-vue-next'
import { computed, reactive, watch } from 'vue'
import { APPLICATION_STATUS } from '@/shared/constants/dict'

interface Props {
  modelValue: boolean
  editingId: string | null
  isViewMode: boolean
  initialData?: Activity | null
}

const props = withDefaults(defineProps<Props>(), {
  initialData: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [
    payload: { text: string; time: string; status: Activity['status']; type: Activity['type'] },
  ]
}>()

const statusOptions = computed(() =>
  Object.entries(APPLICATION_STATUS).map(([value, config]) => ({
    value,
    label: config.label,
  })),
)

const form = reactive({
  text: '',
  time: '',
  status: 'submitted' as Activity['status'],
})

function deriveTypeFromStatus(status: Activity['status']): Activity['type'] {
  if (status === 'draft') return 'draft'
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  return 'submitted'
}

function resetForm() {
  form.text = ''
  form.time = ''
  form.status = 'submitted'
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible && props.initialData) {
      form.text = props.initialData.text
      form.time = props.initialData.time
      form.status = props.initialData.status
    } else if (!visible) {
      resetForm()
    }
  },
)

function handleClose() {
  emit('update:modelValue', false)
}

function handleSave() {
  emit('save', {
    text: form.text.trim(),
    time: form.time,
    status: form.status,
    type: deriveTypeFromStatus(form.status),
  })
}

const dialogTitle = computed(() => (props.isViewMode ? '查看动态' : '编辑动态'))
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="560px"
    class="mc-dialog"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <el-form :model="form" label-width="90px" class="mc-form">
      <el-form-item label="动态内容" required>
        <el-input
          v-model="form.text"
          type="textarea"
          :rows="3"
          placeholder="请输入动态内容"
          :disabled="isViewMode"
        />
      </el-form-item>
      <el-form-item label="时间" required>
        <el-date-picker
          v-model="form.time"
          type="datetime"
          placeholder="选择日期时间"
          value-format="YYYY-MM-DD HH:mm"
          format="YYYY-MM-DD HH:mm"
          style="width: 100%"
          :disabled="isViewMode"
        />
      </el-form-item>
      <el-form-item label="状态" required>
        <el-select
          v-model="form.status"
          placeholder="请选择状态"
          style="width: 100%"
          :disabled="isViewMode"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <button class="mc-btn mc-btn--ghost" @click="handleClose">
        <X :size="16" /> {{ isViewMode ? '关闭' : '取消' }}
      </button>
      <button v-if="!isViewMode" class="mc-btn mc-btn--primary" @click="handleSave">
        <CheckCircle2 :size="16" /> 保存
      </button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
@use '../styles/theme' as *;

.mc-dialog {
  @include message-theme-vars;
  @include mc-dialog;

  font-family: $mc-font-body;
}

.mc-form {
  @include mc-form;
}

.mc-btn {
  &--primary {
    @include mc-btn-primary;
  }

  &--ghost {
    @include mc-btn-ghost;
  }
}
</style>
