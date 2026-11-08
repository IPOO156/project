<script setup lang="ts">
import type {
  AchievementCategory,
  AchievementListItem,
  AchievementMaterialStatus,
  AchievementPracticeTag,
} from '@/shared/api/achievements'
import { Plus, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AchievementLightbox from './components/AchievementLightbox.vue'
import AchievementUploadDialog from './components/AchievementUploadDialog.vue'
import WallFilter from './components/WallFilter.vue'
import WallGrid from './components/WallGrid.vue'
import {
  formatEventMonth,
  PAGE_SIZE,
  PRACTICE_TAG_OPTIONS,
  useAchievementWall,
} from './composables/useAchievementWall'

const route = useRoute()

const CATEGORY_VALUES: AchievementCategory[] = [
  'all',
  'honor',
  'contest',
  'practice',
  'research',
  'completion',
  'other',
]
const STATUS_VALUES: AchievementMaterialStatus[] = ['all', 'archived', 'missing', 'pending']
const PRACTICE_TAG_VALUES: Array<AchievementPracticeTag | ''> = [
  '',
  'volunteer',
  'activity',
  'internship',
  'social_practice',
]

/** 深链参数归一化：非法值一律回落到「全部」，不把脏参数带进请求 */
function readQueryValue<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const value = Array.isArray(raw) ? raw[0] : raw
  return allowed.includes(value as T) ? (value as T) : fallback
}

const {
  category,
  status,
  practiceTag,
  items,
  counts,
  pagination,
  loading,
  loadingMore,
  error,
  errorMode,
  hasLoaded,
  isEmpty,
  hasMore,
  archivedCount,
  missingCount,
  categoryCount,
  latestEventAt,
  statusText,
  notice,
  setNotice,
  detail,
  detailId,
  detailLoading,
  detailError,
  setCategory,
  setPracticeTag,
  clearStatus,
  refresh,
  loadMore,
  openDetail,
  retryDetail,
  closeDetail,
  dispose,
} = useAchievementWall({
  category: readQueryValue(route.query.category, CATEGORY_VALUES, 'all'),
  status: readQueryValue(route.query.status, STATUS_VALUES, 'all'),
  practiceTag: readQueryValue(route.query.tag, PRACTICE_TAG_VALUES, ''),
})

const lastTrigger = ref<HTMLElement | null>(null)
const showUpload = ref(false)
/** 上传入口开关：真实上传接口未落地，点开会提示失败，但入口按需求保留可见 */
const ENABLE_ACHIEVEMENT_UPLOAD = true

const activeItem = computed<AchievementListItem | null>(
  () => items.value.find((item) => item.id === detailId.value) ?? null,
)

/** 页头统计：计数缺失时不渲染该项，不用占位符冒充 */
const stats = computed<Array<{ value: string; label: string }>>(() => {
  const list: Array<{ value: string; label: string }> = []
  if (archivedCount.value !== null) {
    list.push({ value: String(archivedCount.value), label: '项已归档' })
  }
  if (categoryCount.value !== null) {
    list.push({ value: String(categoryCount.value), label: '类成果' })
  }
  if (missingCount.value !== null) {
    list.push({ value: String(missingCount.value), label: '处待补充材料' })
  }
  if (latestEventAt.value) {
    list.push({ value: formatEventMonth(latestEventAt.value), label: '最近收录' })
  }
  return list
})

function handleCategory(next: AchievementCategory) {
  setCategory(next)
}

function handleClearStatus() {
  clearStatus()
}

function handleOpen(item: AchievementListItem) {
  lastTrigger.value = document.activeElement as HTMLElement | null
  openDetail(item.id)
}

function handleCreated(item: AchievementListItem) {
  showUpload.value = false
  if (category.value !== item.category) {
    setCategory(item.category)
  } else {
    refresh()
  }
  setNotice(`「${item.title}」已上传并直接归档`)
}

async function handleClose() {
  closeDetail()
  await nextTick()
  lastTrigger.value?.focus()
  lastTrigger.value = null
}

onMounted(() => {
  refresh()
})

onBeforeUnmount(() => {
  dispose()
})
</script>

<template>
  <div class="achievement-wall">
    <header class="wall-head">
      <div class="wall-head__top">
        <h1 class="wall-head__title">成果墙</h1>
        <button
          v-if="ENABLE_ACHIEVEMENT_UPLOAD"
          type="button"
          class="upload-btn"
          @click="showUpload = true"
        >
          <Plus :size="14" />
          上传证书
        </button>
      </div>
      <p v-if="stats.length" class="wall-head__stats">
        <span v-for="stat in stats" :key="stat.label" class="wall-stat">
          <span class="wall-stat__value">{{ stat.value }}</span>
          {{ stat.label }}
        </span>
      </p>
      <!-- 首屏加载时占位一行统计，避免数据到达后把网格整体下推 -->
      <p
        v-else-if="loading && !hasLoaded"
        class="wall-head__stats wall-head__stats--pending"
        aria-hidden="true"
      ></p>
    </header>

    <div class="wall-tools">
      <WallFilter :model-value="category" :counts="counts" @update:model-value="handleCategory" />
      <button
        v-if="status !== 'all'"
        type="button"
        class="status-chip"
        :aria-label="`清除筛选：${statusText}`"
        @click="handleClearStatus"
      >
        {{ statusText }}
        <X :size="12" />
      </button>
    </div>

    <div
      v-if="category === 'practice'"
      class="practice-tags"
      role="group"
      aria-label="按实践类型筛选"
    >
      <button
        v-for="option in PRACTICE_TAG_OPTIONS"
        :key="option.value || 'all'"
        type="button"
        class="ptag"
        :class="{ 'ptag--active': practiceTag === option.value }"
        :aria-pressed="practiceTag === option.value"
        @click="setPracticeTag(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <p v-if="notice" class="wall-notice" role="status">{{ notice }}</p>

    <WallGrid
      :items="items"
      :loading="loading"
      :loading-more="loadingMore"
      :error="error"
      :error-mode="errorMode"
      :is-empty="isEmpty"
      :has-more="hasMore"
      :pagination="pagination"
      :per-page="PAGE_SIZE"
      @open="handleOpen"
      @retry="refresh"
      @retry-more="loadMore"
      @load-more="loadMore"
    />

    <AchievementUploadDialog
      v-if="showUpload && ENABLE_ACHIEVEMENT_UPLOAD"
      @close="showUpload = false"
      @created="handleCreated"
    />

    <AchievementLightbox
      v-if="detailId"
      :item="activeItem"
      :detail="detail"
      :loading="detailLoading"
      :error="detailError"
      @close="handleClose"
      @retry="retryDetail"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/features/messages/styles/theme' as *;

.achievement-wall {
  @include message-theme-vars;

  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--mc-text);
}

.wall-head__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* 页头尺寸对齐动态中心（ActivityCenterHeader）：26 / 700 / margin 0 */
.wall-head__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--mc-text);
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--mc-wood);
  border-radius: $radius-base;
  background: var(--mc-wood);
  color: var(--mc-card);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background-color $duration-fast $ease-standard;

  &:hover {
    background: var(--mc-wood-light);
    border-color: var(--mc-wood-light);
  }
}

.wall-head__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--mc-text-secondary);
}

.wall-head__stats--pending {
  height: 18px;
}

.wall-stat__value {
  margin-right: 4px;
  font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--mc-text);
}

.wall-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--mc-wood-light);
  border-radius: $radius-base;
  background: var(--mc-primary-faint);
  color: var(--mc-wood);
  font-family: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color $duration-fast $ease-standard,
    color $duration-fast $ease-standard;

  &:hover {
    border-color: var(--mc-wood);
    color: var(--mc-text);
  }
}

.wall-notice {
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-bg);
  font-size: 12px;
  color: var(--mc-text-secondary);
}

/* 实践二级标签：只在实践 chip 激活时出现，不影响首排 chip */
.practice-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: -6px;
}

.ptag {
  height: 24px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  background: transparent;
  color: var(--mc-text-secondary);
  font-family: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color $duration-fast $ease-standard,
    color $duration-fast $ease-standard;

  &:hover {
    color: var(--mc-wood);
  }

  &--active {
    border-color: var(--mc-wood-light);
    background: var(--mc-primary-faint);
    color: var(--mc-wood);
  }
}
</style>
