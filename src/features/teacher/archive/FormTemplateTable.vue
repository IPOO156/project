<script setup lang="ts">
import type { FormTemplateItem } from '@/shared/types/teacher'
import { RefreshCw, Search, SlidersHorizontal, Star, Trash2 } from 'lucide-vue-next'

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
      <span class="mc-card__title"><SlidersHorizontal :size="15" /> 模板列表</span>
      <span class="form-customization__count">{{ total }} 个</span>
    </div>
    <div class="mc-card__body">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="templateName" label="模板名称" min-width="180">
          <template #default="{ row }">
            <span class="form-customization__name">{{ row.templateName }}</span>
            <el-tag
              v-if="row.isDefault === 1"
              type="warning"
              size="small"
              class="form-customization__default"
            >
              默认
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="140">
          <template #default="{ row }"
            ><span class="mc-num">{{ row.code }}</span></template
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
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="230" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              @click="emit('edit', row as FormTemplateItem)"
              >编辑</el-button
            >
            <el-button
              v-if="row.isDefault !== 1"
              text
              type="warning"
              size="small"
              :icon="Star"
              @click="emit('setDefault', row as FormTemplateItem)"
            >
              默认
            </el-button>
            <el-button
              text
              type="danger"
              size="small"
              :icon="Trash2"
              :loading="deletingId === (row as FormTemplateItem).id"
              :disabled="deletingId !== null"
              @click="emit('delete', row as FormTemplateItem)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
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
      <el-empty v-if="!loading && !list.length" description="暂无表单模板" :image-size="72" />
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
