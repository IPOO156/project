<script setup lang="ts">
import type { ArchiveAdminListItem } from '@/shared/types/teacher'
import { FileSearch } from 'lucide-vue-next'
import { useFirstLoadStagger } from '@/shared/composables/useFirstLoadStagger'
import { formatDateTime } from '@/shared/utils/time'
import { statusLabel, statusTagType } from './archiveStatus'

interface Props {
  /** 档案明细列表（/teacher/archives） */
  list: ArchiveAdminListItem[]
  loading: boolean
  total: number
  page: number
  perPage: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'pageChange', page: number): void
  (e: 'sizeChange', size: number): void
  (e: 'openStudentArchive', row: ArchiveAdminListItem): void
  (e: 'openDetail', row: ArchiveAdminListItem): void
}>()

// 首次拿到非空明细后只播一次，筛选 / 翻页 / 刷新改变行数不会重播
const staggerActive = useFirstLoadStagger(() => props.list.length)
</script>

<template>
  <!-- 档案明细 -->
  <section class="mc-card archive-view__detail-list" :class="{ 'is-stagger-armed': staggerActive }">
    <div class="mc-card__head">
      <span class="mc-card__title">
        <FileSearch :size="16" />
        档案明细
      </span>
      <span class="archive-view__count">{{ total }} 条</span>
    </div>
    <div class="mc-card__body">
      <el-table v-loading="loading" class="u-w-full" :data="list">
        <el-table-column label="档案" min-width="320">
          <template #default="{ row }">
            <div class="archive-view__doc">
              <span class="archive-view__doc-type">{{ row.archiveTypeName ?? '-' }}</span>
              <!-- 长档案名此前被压到 217px 且无 tooltip，鼠标悬停可看全称 -->
              <span class="archive-view__doc-title" :title="row.title">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="学生 / 学号" width="160">
          <template #default="{ row }">
            <div class="archive-view__student">
              <span class="archive-view__student-name">{{ row.studentName ?? '-' }}</span>
              <span class="archive-view__student-no">{{ row.studentNo ?? '-' }}</span>
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
        <el-table-column prop="grade" label="年级" width="80" align="right">
          <template #default="{ row }">
            <span v-if="row.grade" class="archive-view__grade">{{ row.grade }}</span>
            <span v-else class="archive-view__empty-cell">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="96">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">
              {{ row.statusLabel ?? statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="156">
          <template #default="{ row }">
            {{ row.submittedAt ? formatDateTime(row.submittedAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="right" fixed="right">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              @click="emit('openStudentArchive', row as ArchiveAdminListItem)"
            >
              学生档案
            </el-button>
            <el-button
              text
              type="primary"
              size="small"
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
    gap: 4px;
  }
  &__doc-type {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__doc-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__student {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__student-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__student-no {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__org {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  &__org-node {
    display: inline-flex;
    max-width: 100%;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: $radius-base;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
