<script setup lang="ts">
import type { ArchiveOverviewRow } from '@/shared/types/teacher'

interface Props {
  /** 当前组织维度（全校 / 学院 / 专业 / 班级） */
  dimension: string
  /** 组织汇总行（/teacher/archives/overview） */
  rows: ArchiveOverviewRow[]
  loading: boolean
}

defineProps<Props>()

/**
 * 单条组织档案在状态分布条中的占比（按总数归一化，避免除 0）。
 */
function ratioWidth(row: ArchiveOverviewRow, key: 'approved' | 'pending' | 'rejected' | 'draft') {
  const total = row.totalArchives ?? 0
  if (!total) return 0
  const map = {
    approved: row.approvedCount ?? 0,
    pending: row.pendingCount ?? 0,
    rejected: row.rejectedCount ?? 0,
    draft: row.draftCount ?? 0,
  }
  return Math.max(0, Math.min(100, (map[key] / total) * 100))
}
</script>

<template>
  <!-- 组织汇总表 -->
  <section class="mc-card archive-view__overview">
    <div class="mc-card__head">
      <span class="mc-card__title">组织汇总 · {{ dimension }}</span>
      <span class="archive-view__count">{{ rows.length }} 个组织</span>
    </div>
    <div class="mc-card__body">
      <el-table v-loading="loading" class="u-w-full" :data="rows" stripe>
        <el-table-column prop="orgName" label="组织" min-width="160" />
        <el-table-column label="学生数" width="90" align="center">
          <template #default="{ row }">
            <span class="mc-num">{{ row.studentCount ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="档案 / 通过率" min-width="280" align="left">
          <template #default="{ row }">
            <div class="archive-view__ratio">
              <div class="archive-view__ratio-meta">
                <span class="archive-view__ratio-total mc-num">
                  {{ row.totalArchives ?? 0 }}
                  <span class="archive-view__ratio-unit">份</span>
                </span>
                <span v-if="row.totalArchives" class="archive-view__ratio-percent mc-num">
                  {{ Math.round(((row.approvedCount ?? 0) / row.totalArchives) * 100) }}%
                </span>
              </div>
              <div class="archive-view__ratio-bar">
                <span
                  class="archive-view__ratio-bar-seg is-success"
                  :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'approved')}%` }"
                />
                <span
                  class="archive-view__ratio-bar-seg is-warning"
                  :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'pending')}%` }"
                />
                <span
                  class="archive-view__ratio-bar-seg is-danger"
                  :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'rejected')}%` }"
                />
                <span
                  class="archive-view__ratio-bar-seg is-draft"
                  :style="{ width: `${ratioWidth(row as ArchiveOverviewRow, 'draft')}%` }"
                />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态分布" min-width="160">
          <template #default="{ row }">
            <div class="archive-view__status-stack">
              <span class="archive-view__status-pill is-success">
                通过 {{ row.approvedCount ?? 0 }}
              </span>
              <span class="archive-view__status-pill is-warning">
                待 {{ row.pendingCount ?? 0 }}
              </span>
              <span class="archive-view__status-pill is-danger">
                退 {{ row.rejectedCount ?? 0 }}
              </span>
              <span class="archive-view__status-pill is-muted"> 稿 {{ row.draftCount ?? 0 }} </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型分布" min-width="200">
          <template #default="{ row }">
            <div v-if="row.archiveTypeDistribution?.length" class="archive-view__types">
              <span
                v-for="t in row.archiveTypeDistribution"
                :key="t.archiveType"
                class="archive-view__type-chip"
              >
                <span class="archive-view__type-name">{{ t.archiveType }}</span>
                <span class="archive-view__type-count mc-num">{{ t.count }}</span>
              </span>
            </div>
            <span v-else class="archive-view__empty-cell">-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !rows.length" description="暂无汇总数据" />
    </div>
  </section>
</template>

<style scoped lang="scss">
@use 'sass:color';
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

  /* ── 组织汇总：通过率条 + 状态胶囊 ── */
  &__ratio {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 200px;
  }
  &__ratio-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
  }
  &__ratio-total {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
  &__ratio-unit {
    font-size: 11px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    margin-left: 2px;
  }
  &__ratio-percent {
    color: $color-success;
    font-weight: 600;
  }
  &__ratio-bar {
    display: flex;
    height: 6px;
    border-radius: 3px;
    overflow: hidden;
    background: var(--el-fill-color-light);
  }
  &__ratio-bar-seg {
    height: 100%;
    transition: width 0.4s $ease-emphasized;

    &.is-success {
      background: $color-success;
    }
    &.is-warning {
      background: $color-warning;
    }
    &.is-danger {
      background: $color-danger;
    }
    &.is-draft {
      background: var(--el-color-primary-light-7);
    }
  }
  &__status-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  &__status-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 12px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;

    &.is-success {
      background: rgba($color-success, 0.12);
      color: color.adjust($color-success, $lightness: -8%);
    }
    &.is-warning {
      background: rgba($color-warning, 0.14);
      color: color.adjust($color-warning, $lightness: -10%);
    }
    &.is-danger {
      background: rgba($color-danger, 0.12);
      color: color.adjust($color-danger, $lightness: -6%);
    }
    &.is-muted {
      background: var(--el-fill-color-light);
      color: var(--el-text-color-secondary);
    }
  }

  /* ── 类型分布 chip ── */
  &__types {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  &__type-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 12px;
    border-radius: $radius-base;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary-light-8);
  }
  &__type-count {
    font-weight: 600;
    background: var(--el-bg-color);
    padding: 0 4px;
    border-radius: 3px;
  }
}
</style>
