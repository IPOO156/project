<script setup lang="ts">
import type { ColumnDef, TypeColumnConfig } from './review-columns'
import { computed, reactive, ref, watch } from 'vue'
import { useReviewStore } from '@/app/stores/stores'
import StatusTag from '@/shared/ui/StatusTag.vue'
import { REVIEW_COLUMNS } from './review-columns'

interface Props {
  modelValue: boolean
  record: any | null
  mode: 'view' | 'edit'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [id: string]
}>()

const reviewStore = useReviewStore()

const editForm = reactive<Record<string, any>>({})
const saving = ref(false)

function getConfigForType(type: string): TypeColumnConfig | null {
  return REVIEW_COLUMNS[type] || null
}

const detailFields = computed(() => {
  const record = props.record
  if (!record) return []
  const config = getConfigForType(record.type)
  if (!config) return []

  return config.columns.map((c: ColumnDef) => {
    let value = record[c.prop]
    if (c.dictOptions && typeof value === 'string') {
      const opt = c.dictOptions.find((o) => o.value === value)
      value = opt ? opt.label : value
    }
    if (c.type === 'status' || c.prop === 'status') {
      value = record.status
    }
    return { label: c.label, prop: c.prop, value: value ?? '-', type: c.type }
  })
})

const editColumns = computed(() => {
  const record = props.record
  if (!record) return []
  const config = getConfigForType(record.type)
  if (!config) return []
  return config.columns.filter((c) => c.type !== 'status' && c.prop !== 'status')
})

watch(
  () => [props.record, props.mode],
  () => {
    if (props.record && props.mode === 'edit') {
      Object.keys(editForm).forEach((k) => delete editForm[k])
      const config = getConfigForType(props.record.type)
      if (config) {
        for (const c of config.columns) {
          if (c.prop !== 'status' && props.record[c.prop] !== undefined) {
            editForm[c.prop] = props.record[c.prop]
          }
        }
      }
    }
  },
  { immediate: true },
)

async function handleSave() {
  if (!props.record) return
  saving.value = true
  try {
    await reviewStore.resubmit(props.record.id, editForm)
    emit('saved', props.record.id)
    emit('update:modelValue', false)
  } catch {
    // ElMessage 已在 store 中处理
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'edit' ? '编辑申报信息' : '申报详情'"
    width="640px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- 查看模式 -->
    <template v-if="record && mode === 'view'">
      <el-descriptions :column="1" border>
        <el-descriptions-item v-for="f in detailFields" :key="f.prop" :label="f.label">
          <template v-if="f.type === 'status'">
            <StatusTag :status="record.status" size="small" />
          </template>
          <span v-else>{{ f.value }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </template>

    <!-- 编辑模式 -->
    <template v-if="record && mode === 'edit'">
      <el-alert title="编辑说明" type="warning" :closable="false" show-icon class="mb-16">
        <p>修改后提交将进入待审核状态，请确保信息准确。</p>
      </el-alert>
      <el-form :model="editForm" label-width="120px">
        <el-form-item v-for="col in editColumns" :key="col.prop" :label="col.label">
          <el-select
            v-if="col.dictOptions"
            v-model="editForm[col.prop]"
            placeholder="请选择"
            class="form-control"
          >
            <el-option
              v-for="opt in col.dictOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-date-picker
            v-else-if="col.type === 'date'"
            v-model="editForm[col.prop]"
            type="month"
            placeholder="选择年月"
            class="form-control"
          />
          <el-input
            v-else
            v-model="editForm[col.prop]"
            :placeholder="`请输入${col.label}`"
            class="form-control"
          />
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button v-if="mode === 'edit'" type="primary" :loading="saving" @click="handleSave">
        保存修改
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-control {
  width: 360px;
}
:deep(.mb-16) {
  margin-bottom: 16px;
}
</style>
