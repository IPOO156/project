<script setup lang="ts">
/**
 * PageToolbar - 页面级工具栏
 *
 * 用法：
 * <template #toolbar>
 *   <PageToolbar
 *     v-model:keyword="keyword"
 *     v-model:status="status"
 *     :status-options="statusOptions"
 *     @search="handleSearch"
 *   >
 *     <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
 *   </PageToolbar>
 * </template>
 */
import { Search, X } from 'lucide-vue-next'

interface Option {
  label: string
  value: string | number
}

interface Props {
  /** 搜索关键字 */
  keyword?: string
  /** 状态筛选值 */
  status?: string | number
  /** 状态可选项（传空数组则不显示状态下拉） */
  statusOptions?: Option[]
  /** 占位符 */
  placeholder?: string
  /** 是否显示搜索按钮 */
  showSearch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  keyword: '',
  status: '',
  statusOptions: () => [],
  placeholder: '搜索关键字',
  showSearch: true,
})

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:status': [value: string | number]
  search: []
  reset: []
}>()

function handleKeywordInput(value: string) {
  emit('update:keyword', value)
}

function handleStatusChange(val: string | number) {
  emit('update:status', val)
}

function handleSearch() {
  emit('search')
}

function handleReset() {
  emit('update:keyword', '')
  emit('update:status', '')
  emit('reset')
}

function onKeydown(evt: Event | KeyboardEvent) {
  const e = evt as KeyboardEvent
  if (e.key === 'Enter') {
    handleSearch()
  }
}

defineExpose({ keyword: props.keyword, status: props.status })
</script>

<template>
  <div class="page-toolbar">
    <!-- 左侧：筛选区 -->
    <div class="page-toolbar__filters">
      <div class="page-toolbar__search">
        <el-input
          :model-value="keyword"
          :placeholder="placeholder"
          :prefix-icon="Search"
          clearable
          aria-label="搜索"
          @update:model-value="handleKeywordInput"
          @keydown="onKeydown"
        />
      </div>

      <el-select
        v-if="statusOptions.length > 0"
        :model-value="status"
        placeholder="状态"
        clearable
        style="width: 140px"
        aria-label="状态筛选"
        @update:model-value="handleStatusChange"
        @change="handleSearch"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>

      <el-button v-if="showSearch" type="primary" :icon="Search" @click="handleSearch">
        搜索
      </el-button>
      <el-button :icon="X" @click="handleReset"> 重置 </el-button>
    </div>

    <!-- 右侧：操作区 -->
    <div v-if="$slots.default" class="page-toolbar__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  flex-wrap: wrap;
  width: 100%;

  &__filters {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
    flex: 1 1 auto;
    min-width: 0;
  }

  &__search {
    width: 220px;
  }

  &__actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .page-toolbar__search {
    width: 100%;
  }

  .page-toolbar__filters {
    width: 100%;
  }
}
</style>
