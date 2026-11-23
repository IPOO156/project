<script setup lang="ts">
import type { GradeImportListItem, SemesterItem } from '@/shared/types/teacher'
import { Search } from 'lucide-vue-next'
import { useFirstLoadStagger } from '@/shared/composables/useFirstLoadStagger'

const props = defineProps<{
  semesters: SemesterItem[]
  list: GradeImportListItem[]
  total: number
  loading: boolean
  page: number
  perPage: number
}>()
const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'pageChange', page: number): void
  (e: 'openDetail', row: GradeImportListItem): void
}>()

// 首次拿到非空导入记录后只播一次，翻页 / 筛选改变行数不会重播
const staggerActive = useFirstLoadStagger(() => props.list.length)

const semesterId = defineModel<number | undefined>('semesterId', { required: true })
const importStatus = defineModel<number | undefined>('importStatus', { required: true })

function importStatusType(status: number | null) {
  return status === 1 ? 'success' : status === 2 ? 'danger' : 'warning'
}
</script>

<template>
  <div class="mc-filter-bar grade-import__filter">
    <el-form inline @submit.prevent>
      <el-form-item label="学期">
        <el-select v-model="semesterId" class="u-w-200" clearable placeholder="全部学期">
          <el-option v-for="s in semesters" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="importStatus" class="u-w-140" clearable placeholder="全部状态">
          <el-option label="导入中" :value="0" />
          <el-option label="完成" :value="1" />
          <el-option label="失败" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="emit('search')">查询</el-button>
        <el-button @click="emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </div>

  <el-table
    v-loading="loading"
    class="u-w-full"
    :class="{ 'is-stagger-armed': staggerActive }"
    :data="list"
    stripe
  >
    <el-table-column prop="semesterName" label="学期" min-width="140" />
    <el-table-column prop="fileName" label="文件名" min-width="160" show-overflow-tooltip />
    <el-table-column prop="operatorName" label="操作人" width="100" />
    <el-table-column prop="totalCount" label="总记录" width="80" align="center" />
    <el-table-column prop="successCount" label="成功" width="70" align="center" />
    <el-table-column prop="failCount" label="失败" width="70" align="center" />
    <el-table-column label="状态" width="90" align="center">
      <template #default="{ row }">
        <el-tag :type="importStatusType(row.importStatus)" size="small">
          {{ row.importStatusLabel ?? '未知' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="startedAt" label="开始时间" width="170" />
    <el-table-column label="操作" width="90" align="center" fixed="right">
      <template #default="{ row }">
        <el-button
          text
          type="primary"
          size="small"
          @click="emit('openDetail', row as GradeImportListItem)"
        >
          详情
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <div class="grade-import__pagination">
    <el-pagination
      :current-page="page"
      :page-size="perPage"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="emit('pageChange', $event)"
    />
  </div>
</template>

<style scoped lang="scss">
// 表格刷入：右→左 / 0.32s / 40ms 递进 / 仅首次加载（筛选 / 翻页 / 轮询不重播）
.is-stagger-armed {
  :deep(.el-table) {
    --mc-row-duration: 0.32s;
    --mc-row-delay: 0.04s;
    --mc-row-offset: 60px;
    --mc-row-easing: #{$ease-out-cubic};
  }

  @include table-row-staggered(20);
}

.grade-import {
  &__filter {
    padding: 0 0 16px;
    margin-bottom: 4px;
    background: transparent;
    border: none;
  }
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
