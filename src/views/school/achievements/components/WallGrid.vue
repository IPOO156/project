<script setup lang="ts">
import type { AchievementListItem, AchievementPagination } from '@/shared/api/achievements'
import { CircleAlert, Inbox } from 'lucide-vue-next'
import AchievementTile from './AchievementTile.vue'

const props = withDefaults(
  defineProps<{
    items: AchievementListItem[]
    loading: boolean
    loadingMore: boolean
    error: boolean
    errorMode?: 'reset' | 'more' | null
    isEmpty: boolean
    hasMore: boolean
    pagination: AchievementPagination | null
    perPage?: number
  }>(),
  { perPage: 12, errorMode: null },
)

const emit = defineEmits<{
  (e: 'open', item: AchievementListItem): void
  (e: 'retry'): void
  (e: 'retryMore'): void
  (e: 'loadMore'): void
}>()

/** 翻页失败才重试翻页；筛选失败重试当前筛选，否则 hasMore 为 false 时点了没反应 */
function handleErrorRetry() {
  if (props.errorMode === 'more') emit('retryMore')
  else emit('retry')
}
</script>

<template>
  <div class="wall-grid-wrap">
    <!-- 加载态：骨架数量取 per_page，高度对齐真实卡，避免布局跳动 -->
    <div v-if="loading" class="grid" role="status" aria-busy="true" aria-label="成果加载中">
      <div v-for="n in perPage" :key="n" class="skeleton" aria-hidden="true">
        <div class="skeleton__thumb"></div>
        <div class="skeleton__body">
          <span class="skeleton__line"></span>
          <span class="skeleton__line skeleton__line--short"></span>
        </div>
      </div>
    </div>

    <!-- 失败态：没有任何数据 → 整块错误态 -->
    <div v-else-if="error && items.length === 0" class="state state--error" role="alert">
      <CircleAlert class="state__icon" :size="26" />
      <p class="state__title">成果墙加载失败</p>
      <p class="state__desc">请检查网络后重试，当前筛选条件会保留。</p>
      <button type="button" class="state__action" @click="$emit('retry')">重试</button>
    </div>

    <!-- 空态：文案按方案/原型 -->
    <div v-else-if="isEmpty" class="state state--empty" role="status">
      <Inbox class="state__icon" :size="26" />
      <p class="state__empty-text">该分类暂无成果，换个分类看看。</p>
    </div>

    <template v-else>
      <div class="grid">
        <AchievementTile
          v-for="item in items"
          :key="item.id"
          :item="item"
          @open="$emit('open', $event)"
        />
      </div>

      <div v-if="error" class="load-error" role="alert">
        <span>
          {{
            errorMode === 'more'
              ? '加载更多失败，已显示的内容不受影响。'
              : '本次筛选加载失败，已显示的内容不受影响。'
          }}
        </span>
        <button type="button" class="load-error__retry" @click="handleErrorRetry">重试</button>
      </div>

      <div v-if="hasMore" class="grid__more">
        <button type="button" class="more-btn" :disabled="loadingMore" @click="$emit('loadMore')">
          {{
            loadingMore
              ? '加载中…'
              : `加载更多（已显示 ${items.length} / ${pagination?.total ?? items.length}）`
          }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

/* ---------- 骨架 ---------- */
.skeleton {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--mc-border);
  border-radius: $radius-lg;
  background: var(--mc-card);
  overflow: hidden;
  animation: aw-skeleton 1.8s ease-in-out infinite;
}

.skeleton__thumb {
  height: 148px;
  background: var(--mc-bg);
  border-bottom: 1px solid var(--mc-border);
}

.skeleton__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
}

/* 行高对齐真实卡：标题行 20.3 / meta 行 18，总高与 .tile 相差 < 2px */
.skeleton__line {
  height: 20px;
  border-radius: $radius-sm;
  background: var(--mc-row-hover);
}

.skeleton__line--short {
  width: 55%;
  height: 18px;
}

@keyframes aw-skeleton {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

/* ---------- 空 / 错态 ---------- */
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-lg;
  background: var(--mc-card);
  text-align: center;
}

.state__icon {
  color: var(--mc-text-secondary);
  opacity: 0.75;
  margin-bottom: 12px;
}

.state__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--mc-text);
}

.state__desc {
  margin: 6px 0 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--mc-text-secondary);
}

.state__action {
  height: 32px;
  padding: 0 18px;
  border: 1px solid var(--mc-wood);
  border-radius: $radius-base;
  background: var(--mc-wood);
  color: var(--mc-card);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background: var(--mc-wood-light);
    border-color: var(--mc-wood-light);
  }
}

.state--empty {
  padding: 60px 24px;
}

.state__empty-text {
  margin: 0;
  font-size: 13px;
  color: var(--mc-text-secondary);
}

/* ---------- 加载更多 ---------- */
.load-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-danger-fade);
  font-size: 12px;
  color: var(--mc-text);
}

.load-error__retry {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--mc-danger);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}

.grid__more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.more-btn {
  height: 32px;
  padding: 0 18px;
  border: 1px solid var(--mc-border);
  border-radius: $radius-base;
  background: var(--mc-card);
  color: var(--mc-text);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color $duration-fast $ease-standard,
    color $duration-fast $ease-standard;

  &:hover:not(:disabled) {
    border-color: var(--mc-wood);
    color: var(--mc-wood);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
}

@media (max-width: 1199px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 899px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 599px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
