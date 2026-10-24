<script setup lang="ts">
import type { ArchiveAdminDetail } from '@/shared/types/teacher'
import { computed } from 'vue'
import { statusLabel, statusTagType } from './archiveStatus'

interface Props {
  modelValue: boolean
  loading: boolean
  detail: ArchiveAdminDetail | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'closed'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

function renderValue(v: unknown) {
  if (v == null) return '-'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

const detailEntries = computed(() => {
  if (!props.detail?.details) return []
  return Object.entries(props.detail.details)
})
</script>

<template>
  <!-- 详情抽屉 -->
  <el-drawer
    v-model="visible"
    title="档案详情"
    size="56%"
    :destroy-on-close="true"
    class="archive-view__drawer"
    @closed="emit('closed')"
  >
    <div v-loading="loading" class="archive-view__drawer-body">
      <template v-if="detail">
        <!-- 顶部摘要 -->
        <div class="archive-view__drawer-hero">
          <div class="archive-view__drawer-hero-meta">
            <span class="archive-view__drawer-type">{{ detail.archiveTypeName }}</span>
            <el-tag :type="statusTagType(detail.status)" size="small" effect="light">
              {{ detail.statusLabel ?? statusLabel(detail.status) }}
            </el-tag>
          </div>
          <h3 class="archive-view__drawer-title">{{ detail.title }}</h3>
          <div class="archive-view__drawer-hero-line">
            <span>{{ detail.student?.name ?? '-' }}</span>
            <span class="archive-view__drawer-dot">·</span>
            <span class="mc-num">{{ detail.student?.studentNo ?? '-' }}</span>
            <span
              v-if="
                detail.student?.collegeName ||
                detail.student?.majorName ||
                detail.student?.className
              "
              class="archive-view__drawer-dot"
              >·</span
            >
            <span
              v-if="
                detail.student?.collegeName ||
                detail.student?.majorName ||
                detail.student?.className
              "
            >
              {{
                [detail.student?.collegeName, detail.student?.majorName, detail.student?.className]
                  .filter(Boolean)
                  .join(' / ')
              }}
            </span>
          </div>
        </div>

        <!-- 基本信息 -->
        <section class="archive-view__drawer-section">
          <p class="archive-view__drawer-section-title">基本信息</p>
          <el-descriptions :column="2" border size="small" class="archive-view__drawer-desc">
            <el-descriptions-item label="学期">{{
              detail.semesterName ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="获得时间">{{
              detail.obtainedAt ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{
              detail.submittedAt ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="审核人">{{
              detail.auditorName ?? '-'
            }}</el-descriptions-item>
            <el-descriptions-item v-if="detail.rejectedReason" label="退回原因" :span="2">
              <span class="archive-view__rejected">{{ detail.rejectedReason }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <!-- 扩展字段 -->
        <section v-if="detailEntries.length" class="archive-view__drawer-section">
          <p class="archive-view__drawer-section-title">
            扩展字段
            <span class="archive-view__drawer-section-count">{{ detailEntries.length }} 项</span>
          </p>
          <ul class="archive-view__kv">
            <li v-for="[key, value] in detailEntries" :key="key" class="archive-view__kv-item">
              <span class="archive-view__kv-key">{{ key }}</span>
              <span class="archive-view__kv-value">{{ renderValue(value) }}</span>
            </li>
          </ul>
        </section>

        <el-empty v-if="!detailEntries.length" description="暂无扩展字段" :image-size="72" />
      </template>
      <el-empty v-else-if="!loading" description="暂无详情数据" :image-size="72" />
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.archive-view {
  /* ── 详情抽屉 ── */
  &__drawer-body {
    padding: 4px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
  }
  &__drawer-hero {
    padding: 20px 22px;
    border-radius: $radius-lg;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border: 1px solid var(--el-color-primary-light-8);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      right: -40px;
      top: -40px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba($color-accent, 0.16), transparent 70%);
    }
  }
  &__drawer-hero-meta {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: 8px;
  }
  &__drawer-type {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  &__drawer-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    letter-spacing: -0.01em;
  }
  &__drawer-hero-line {
    margin-top: 8px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  &__drawer-dot {
    color: var(--el-text-color-placeholder);
  }
  &__drawer-section-title {
    margin: 0 0 $spacing-sm;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    &::before {
      content: '';
      display: inline-block;
      width: 3px;
      height: 12px;
      border-radius: 0 3px 3px 0;
      background: var(--el-color-primary);
    }
  }
  &__drawer-section-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
  }
  &__drawer-desc {
    :deep(.el-descriptions__label) {
      color: var(--el-text-color-secondary);
      font-weight: 500;
    }
  }
  &__rejected {
    color: $color-danger;
  }

  /* 扩展字段：定义列表样式 */
  &__kv {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: $radius-lg;
    overflow: hidden;
    background: var(--el-bg-color);
  }
  &__kv-item {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: $spacing-lg;
    padding: 12px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    &:nth-child(odd) {
      background: var(--el-fill-color-light);
    }
  }
  &__kv-key {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    word-break: break-all;
  }
  &__kv-value {
    font-size: 13px;
    color: var(--el-text-color-primary);
    word-break: break-word;
    line-height: 1.6;
  }
}
</style>
