<script setup lang="ts">
import type { ArchiveAdminListItem } from '@/shared/types/teacher'
import { Eye, FileSearch, UserRound } from 'lucide-vue-next'
import { statusLabel, statusTagType } from './archiveStatus'

interface Props {
  /** 档案明细列表（/teacher/archives） */
  list: ArchiveAdminListItem[]
  loading: boolean
  total: number
  page: number
  perPage: number
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'pageChange', page: number): void
  (e: 'sizeChange', size: number): void
  (e: 'openStudentArchive', row: ArchiveAdminListItem): void
  (e: 'openDetail', row: ArchiveAdminListItem): void
}>()
</script>

<template>
  <!-- 档案明细 -->
  <section class="mc-card archive-view__detail-list">
    <div class="mc-card__head">
      <span class="mc-card__title">
        <FileSearch :size="14" />
        档案明细
      </span>
      <span class="archive-view__count">{{ total }} 条</span>
    </div>
    <div class="mc-card__body">
      <el-table v-loading="loading" class="u-w-full" :data="list" stripe>
        <el-table-column label="档案" min-width="220">
          <template #default="{ row }">
            <div class="archive-view__doc">
              <span class="archive-view__doc-type">{{ row.archiveTypeName ?? '-' }}</span>
              <span class="archive-view__doc-title">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="学生 / 学号" width="160">
          <template #default="{ row }">
            <div class="archive-view__student">
              <span class="archive-view__student-name">{{ row.studentName ?? '-' }}</span>
              <span class="archive-view__student-no mc-num">{{ row.studentNo ?? '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="组织归属" min-width="200">
          <template #default="{ row }">
            <div class="archive-view__org">
              <span v-if="row.collegeName" class="archive-view__org-node">{{
                row.collegeName
              }}</span>
              <span v-if="row.majorName" class="archive-view__org-node is-soft">{{
                row.majorName
              }}</span>
              <span v-if="row.className" class="archive-view__org-node is-soft">{{
                row.className
              }}</span>
              <span
                v-if="!row.collegeName && !row.majorName && !row.className"
                class="archive-view__empty-cell"
                >-</span
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="grade" label="年级" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.grade" class="archive-view__grade">{{ row.grade }}</span>
            <span v-else class="archive-view__empty-cell">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">
              {{ row.statusLabel ?? statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submittedAt" label="提交时间" width="160">
          <template #default="{ row }">{{ row.submittedAt ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              :icon="UserRound"
              @click="emit('openStudentArchive', row as ArchiveAdminListItem)"
            >
              学生档案
            </el-button>
            <el-button
              text
              type="primary"
              size="small"
              :icon="Eye"
              @click="emit('openDetail', row as ArchiveAdminListItem)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="archive-view__pagination">
        <el-pagination
          :current-page="page"
          :page-size="perPage"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="emit('pageChange', $event)"
          @size-change="emit('sizeChange', $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.archive-view {
  /* ── 数量徽标 ── */
  &__count {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__empty-cell {
    color: var(--el-text-color-placeholder);
  }

  /* ── 档案明细 ── */
  &__doc {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__doc-type {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  &__doc-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__student {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__student-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  &__student-no {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__org {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  &__org-node {
    display: inline-flex;
    padding: 2px 8px;
    font-size: 12px;
    border-radius: $radius-base;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    &.is-soft {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }
  }
  &__grade {
    display: inline-block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  &__pagination {
    margin-top: $spacing-lg;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
