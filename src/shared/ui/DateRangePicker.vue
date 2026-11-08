<script setup lang="ts">
/**
 * DateRangePicker - 响应式日期范围选择
 *
 * 桌面端沿用 el-date-picker 的 daterange（双月面板）；宽 ≤768px 时双月面板
 * 固定 646px，会横向溢出 390 视口，故窄屏改为「开始 / 结束」两个单月 date
 * 选择器纵向排列。不改 Element Plus 面板宽度，也不覆盖其内部布局。
 *
 * 窄屏取值规则（保证 v-model 始终是完整区间，避免半截状态）：
 *  - 只选开始或结束其中一个时，另一端自动补齐为同一天；
 *  - 清空任意一端即清空整个区间，与桌面端 clearable 的语义一致。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

type DateRangeValue = [string, string] | null

const props = withDefaults(
  defineProps<{
    modelValue?: DateRangeValue
    startPlaceholder?: string
    endPlaceholder?: string
    /** 与 el-date-picker 的 value-format 一致，窄屏拆分时按同一格式回填 */
    valueFormat?: string
    rangeSeparator?: string
    clearable?: boolean
  }>(),
  {
    modelValue: null,
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期',
    valueFormat: 'YYYY-MM-DD',
    rangeSeparator: '至',
    clearable: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeValue]
}>()

/** 与 feedback.scss 的窄屏弹窗兜底保持同一断点 */
const NARROW_MAX_WIDTH = 768

const isNarrow = ref(false)
let mediaQuery: MediaQueryList | null = null

function onMediaChange(event: MediaQueryListEvent) {
  isNarrow.value = event.matches
}

onMounted(() => {
  mediaQuery = window.matchMedia(`(max-width: ${NARROW_MAX_WIDTH}px)`)
  isNarrow.value = mediaQuery.matches
  mediaQuery.addEventListener('change', onMediaChange)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
})

/** 桌面端：daterange 直接回传，空值统一收敛为 null */
function onDesktopChange(value: unknown) {
  if (Array.isArray(value) && value.length === 2) {
    emit('update:modelValue', [String(value[0]), String(value[1])])
    return
  }
  emit('update:modelValue', null)
}

// ── 窄屏：拆成两个单月选择器 ──
const startValue = ref<string | null>(null)
const endValue = ref<string | null>(null)

watch(
  () => props.modelValue,
  (value) => {
    startValue.value = value?.[0] ?? null
    endValue.value = value?.[1] ?? null
  },
  { immediate: true },
)

function toDateString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function commitNarrow() {
  emit(
    'update:modelValue',
    startValue.value && endValue.value ? [startValue.value, endValue.value] : null,
  )
}

function onStartChange(value: unknown) {
  startValue.value = toDateString(value)
  if (!startValue.value) {
    endValue.value = null
    commitNarrow()
    return
  }
  // 开始日晚于结束日时把结束日拉到同一天，避免出现空区间
  if (!endValue.value || endValue.value < startValue.value) {
    endValue.value = startValue.value
  }
  commitNarrow()
}

function onEndChange(value: unknown) {
  endValue.value = toDateString(value)
  if (!endValue.value) {
    startValue.value = null
    commitNarrow()
    return
  }
  if (!startValue.value || startValue.value > endValue.value) {
    startValue.value = endValue.value
  }
  commitNarrow()
}
</script>

<template>
  <el-date-picker
    v-if="!isNarrow"
    :model-value="modelValue ?? undefined"
    type="daterange"
    :range-separator="rangeSeparator"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    :value-format="valueFormat"
    :clearable="clearable"
    @update:model-value="onDesktopChange"
  />
  <div v-else class="date-range-narrow">
    <el-date-picker
      :model-value="startValue ?? undefined"
      type="date"
      :placeholder="startPlaceholder"
      :value-format="valueFormat"
      :clearable="clearable"
      @update:model-value="onStartChange"
    />
    <el-date-picker
      :model-value="endValue ?? undefined"
      type="date"
      :placeholder="endPlaceholder"
      :value-format="valueFormat"
      :clearable="clearable"
      @update:model-value="onEndChange"
    />
  </div>
</template>

<style scoped lang="scss">
.date-range-narrow {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  // 消费方的固定宽度 class（如 u-w-240）在窄屏下不再适用，统一占满表单行
  width: 100%;

  :deep(.el-date-editor) {
    width: 100%;
  }
}
</style>
