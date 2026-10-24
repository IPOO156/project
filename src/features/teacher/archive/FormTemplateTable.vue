<script setup lang="ts">
import type { FormTemplateItem } from '@/shared/types/teacher'
import { RefreshCw, Search } from 'lucide-vue-next'
import EmptyState from '@/shared/ui/EmptyState.vue'
import RowActions from '@/shared/ui/RowActions.vue'
import { formatDateTime } from '@/shared/utils/time'

defineProps<{
  list: FormTemplateItem[]
  total: number
  loading: boolean
  deletingId: number | null
  categoryOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'currentChange', page: number): void
  (e: 'sizeChange', size: number): void
  (e: 'edit', item: FormTemplateItem): void
  (e: 'setDefault', item: FormTemplateItem): void
  (e: 'delete', item: FormTemplateItem): void
}>()
const page = defineModel<number>('page', { required: true })
const perPage = defineModel<number>('perPage', { required: true })
const category = defineModel<string>('category', { required: true })
const status = defineModel<number | ''>('status', { required: true })
const keyword = defineModel<string>('keyword', { required: true })
</script>

<template>
  <div class="mc-filter-bar">
    <el-form inline @submit.prevent>
      <el-form-item label="分类">
        <el-select v-model="category" class="u-w-140" clearable>
          <el-option
            v-for="c in categoryOptions"
            :key="c.value"
            :label="c.label"
            :value="c.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="status" class="u-w-120" clearable>
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input
          v-model="keyword"
          class="u-w-200"
          placeholder="模板名称 / 编码"
          clearable
          @keyup.enter="emit('search')"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="emit('search')">查询</el-button>
        <el-button :icon="RefreshCw" @click="emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </div>

  <div class="mc-card">
    <div class="mc-card__head">
      <span class="mc-card__title">模板列表</span>
      <span class="form-customization__count">{{ total }} 个</span>
    </div>
    <div class="mc-card__body">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="templateName" label="模板名称" min-width="180">
          <template #default="{ row }">
            <span class="form-customization__name">{{ row.templateName }}</span>
            <el-tag
              v-if="row.isDefault === 1"
              type="primary"
              effect="plain"
              size="small"
              class="form-customization__default"
            >
              默认
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="170">
          <template #default="{ row }"
            ><span class="mc-num form-customization__code">{{ row.code }}</span></template
          >
        </el-table-column>
        <el-table-column prop="categoryLabel" label="分类" width="100" align="center" />
        <el-table-column label="版本" width="80" align="center">
          <template #default="{ row }"
            ><span class="mc-num">v{{ row.version ?? 1 }}</span></template
          >
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{
              row.statusLabel
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="145">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="132" align="center" fixed="right">
          <template #default="{ row }">
            <RowActions>
              <el-button
                text
                type="primary"
                size="small"
                @click="emit('edit', row as FormTemplateItem)"
                >编辑</el-button
              >
              <template #more>
                <el-dropdown-item
                  v-if="row.isDefault !== 1"
                  @click="emit('setDefault', row as FormTemplateItem)"
                >
                  设为默认
                </el-dropdown-item>
                <el-dropdown-item
                  divided
                  class="row-actions__danger"
                  :disabled="deletingId !== null"
                  @click="emit('delete', row as FormTemplateItem)"
                >
                  {{ deletingId === (row as FormTemplateItem).id ? '删除中…' : '删除' }}
                </el-dropdown-item>
              </template>
            </RowActions>
          </template>
        </el-table-column>
        <template #empty>
          <EmptyState text="暂无表单模板" compact />
        </template>
      </el-table>
      <div class="form-customization__pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="perPage"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="emit('currentChange', $event)"
          @size-change="emit('sizeChange', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-customization {
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__name {
    font-weight: 500;
  }

  // 模板编码是下划线分隔的长标识，保持单行，避免在字符中间断行
  &__code {
    white-space: nowrap;
  }

  &__default {
    margin-left: 8px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
  }
}
</style>
