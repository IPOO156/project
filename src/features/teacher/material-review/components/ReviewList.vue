<script setup lang="ts">
import { Check, Eye, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { APPLICATION_TYPE_MAP } from '@/shared/constants/dict'
import ReviewHistory from './ReviewHistory.vue'

/**
 * ReviewList - 待审核材料列表（含批量操作栏）
 *
 * 从 CollegeReview 抽取，避免单文件超过 600 行限制（CLAUDE.md §2.5）。
 * 展示审核卡片 + 全选/批量通过/批量退回修改。
 */
interface Props {
  items: any[]
  selectedIds: Set<string | number>
  isAdmin: boolean
  isProcessing: boolean
}
defineProps<Props>()
const emit = defineEmits<{
  (e: 'toggle', id: string | number): void
  (e: 'toggleAll', checked: boolean): void
  (e: 'batchReject', reason: string): void
  (e: 'batchApprove'): void
  (e: 'viewDetail', item: any): void
  (e: 'approve', item: any): void
  (e: 'reject', item: any): void
}>()

const batchRejectReason = ref('')

/** 申报类型显示名（统一走 APPLICATION_TYPE_MAP 集中字典） */
function getTypeLabel(type: string): string {
  return APPLICATION_TYPE_MAP[type] ?? type
}

/** 卡片主标题：优先姓名，缺少姓名时回退申报标题 */
function displayName(item: any): string {
  return item.name || item.title || ''
}

/** 副信息行：班级 · 学号；两者皆缺时回退学期 */
function metaText(item: any): string {
  const parts = [item.className, item.studentId].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return item.semester || ''
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'competition':
    case 'competitionStar':
    case 'innovationStar':
      return '#e6a23c'
    case 'socialPractice':
      return '#10b981'
    case 'research':
    case 'scientificProject':
    case 'softwareCopyright':
    case 'paper':
      return '#8b5cf6'
    case 'scholarship':
      return '#ef4444'
    case 'training':
      return '#1e3a5f'
    default:
      return '#64748b'
  }
}

function toggle(id: string | number) {
  emit('toggle', id)
}
/** el-checkbox change 事件回传 CheckboxValueType（string|number|boolean），归一化为 boolean */
function toggleAll(checked: boolean | string | number) {
  emit('toggleAll', Boolean(checked))
}
function onBatchReject() {
  emit('batchReject', batchRejectReason.value)
}
function onBatchApprove() {
  emit('batchApprove')
}
</script>

<template>
  <div class="review-list">
    <!-- 批量操作栏 -->
    <div class="batch-bar">
      <div class="batch-bar__left">
        <el-checkbox
          :model-value="selectedIds.size > 0 && selectedIds.size === items.length"
          :indeterminate="selectedIds.size > 0 && selectedIds.size < items.length"
          @change="toggleAll"
          >全选</el-checkbox
        >
        <span v-if="selectedIds.size > 0" class="batch-bar__count"
          >已选 {{ selectedIds.size }} 条</span
        >
      </div>
      <div class="batch-bar__right">
        <el-input
          v-model="batchRejectReason"
          placeholder="批量退回原因…"
          size="small"
          class="batch-reject-input"
        />
        <el-button
          type="danger"
          size="small"
          :disabled="selectedIds.size === 0 || !batchRejectReason.trim()"
          @click="onBatchReject"
          >批量退回修改</el-button
        >
        <el-button
          type="success"
          size="small"
          :disabled="selectedIds.size === 0"
          @click="onBatchApprove"
          >批量通过</el-button
        >
      </div>
    </div>

    <!-- 待审核列表 -->
    <div v-if="items.length > 0" class="review-cards">
      <div
        v-for="item in items"
        :key="item.id"
        class="review-card"
        :class="{ 'is-duplicate': item.duplicate }"
      >
        <el-checkbox
          v-if="isAdmin"
          :model-value="selectedIds.has(item.id)"
          class="review-card__checkbox"
          @change="toggle(item.id)"
        />
        <div class="review-card__main">
          <div class="review-card__top">
            <div class="review-card__student">
              <el-avatar :size="36" class="review-card__avatar">{{
                displayName(item).charAt(0)
              }}</el-avatar>
              <div>
                <div class="review-card__name">{{ displayName(item) }}</div>
                <div v-if="metaText(item)" class="review-card__meta">{{ metaText(item) }}</div>
              </div>
            </div>
            <el-tag
              :color="getTypeColor(item.type)"
              effect="dark"
              size="small"
              class="review-card__type"
              >{{ getTypeLabel(item.type) }}</el-tag
            >
          </div>
          <div class="review-card__info">
            <span>提交：{{ item.submitDate }}</span>
            <el-tag v-if="item.duplicate" type="warning" size="small" effect="plain" class="dup-tag"
              >有同类重复</el-tag
            >
          </div>
          <ReviewHistory :history="item.history || []" />
          <div class="review-card__actions">
            <el-button
              type="primary"
              size="small"
              plain
              :icon="Eye"
              @click="emit('viewDetail', item)"
              >审核</el-button
            >
            <el-button
              v-if="isAdmin"
              type="success"
              size="small"
              plain
              :icon="Check"
              :loading="isProcessing"
              @click="emit('approve', item)"
              >通过</el-button
            >
            <el-button
              v-if="isAdmin"
              type="danger"
              size="small"
              plain
              :icon="X"
              :loading="isProcessing"
              @click="emit('reject', item)"
              >退回修改</el-button
            >
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无待审核材料" :image-size="80" />
  </div>
</template>

<style scoped lang="scss">
// ── 批量操作 ──
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-lg;
  background: #f0f4ff;
  border: 1px solid #d0d9f5;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }
  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__count {
    font-size: $font-size-sm;
    color: $color-primary-lighter;
    font-weight: 600;
  }
}

// ── 审核卡片 ──
.review-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: $spacing-md;
}
.review-card {
  position: relative;
  border: 1px solid var(--el-border-color-light);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  background: var(--el-bg-color);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  &:hover {
    border-color: $color-accent;
    box-shadow: $shadow-sm;
  }
  &.is-duplicate {
    border-color: $color-warning;
    background: #fffbeb;
  }
  &__checkbox {
    position: absolute;
    top: $spacing-md;
    left: $spacing-md;
  }
  &__main {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-md;
  }
  &__student {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }
  &__avatar {
    background: $color-primary-lightest;
    color: $color-primary;
    font-weight: 600;
  }
  &__name {
    font-size: $font-size-base;
    font-weight: 600;
    color: $color-text-primary;
  }
  &__meta {
    font-size: $font-size-xs;
    color: var(--el-text-color-secondary);
    margin-top: 1px;
  }
  &__type {
    color: #fff;
    border: 0;
  }
  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    color: var(--el-text-color-secondary);
  }
  &__actions {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
    padding-top: $spacing-sm;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
.dup-tag {
  font-size: $font-size-xs;
}

.batch-reject-input {
  width: 220px;
}

@media (max-width: 768px) {
  .review-cards {
    grid-template-columns: 1fr;
  }
}
</style>
