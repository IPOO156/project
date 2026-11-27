<script setup lang="ts">
import type { Component } from 'vue'
import { LayoutGrid } from 'lucide-vue-next'

/**
 * 申报 / 奖项中心通用的分类切换条。
 * 放在内容上方而不是再开一条左侧栏：避免和系统最左侧菜单并排成两列，
 * 也让「填写信息 → 记录」保持在同一列、上下长度一致。
 *
 * 每个分类带图标与自己的状态，状态文案由调用方按优先级算好：
 * 退回 N / 待审 N / N 条 / 未填报（未报名），不点进去也知道哪里还有事要做。
 * 两个中心共用本组件，保证状态胶囊、计数与激活态完全一致。
 */
export interface CategoryBarItem {
  key: string
  label: string
  icon: Component
  state: { text: string; tone: 'danger' | 'warning' | 'count' | 'muted' }
}

interface Props {
  /** 区块标题，如「申报分类」「奖项分类」 */
  title: string
  /** 右侧汇总文案，如「1/10 已填报」 */
  meta?: string
  items: CategoryBarItem[]
  activeKey: string
  /** 宽屏每行显示的分类数（申报 5 列、奖项 3 列）；窄屏自动降级为流式列数 */
  columns?: number
}

withDefaults(defineProps<Props>(), {
  meta: '',
  columns: 5,
})

const emit = defineEmits<{
  (e: 'select', key: string): void
}>()
</script>

<template>
  <section class="hub-cats" :aria-label="title">
    <div class="hub-cats__head">
      <span class="hub-cats__title"><LayoutGrid :size="15" />{{ title }}</span>
      <span v-if="meta" class="hub-cats__meta">{{ meta }}</span>
    </div>

    <!-- 列数随分类总量变化，用 CSS 变量传入；窄屏在样式里降级为流式列数 -->
    <div class="hub-cats__list" :style="{ '--hub-cats-cols': columns }">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="hub-cats__item"
        :class="{ 'is-active': item.key === activeKey }"
        :aria-current="item.key === activeKey ? 'page' : undefined"
        @click="emit('select', item.key)"
      >
        <span class="hub-cats__icon">
          <component :is="item.icon" :size="16" />
        </span>
        <span class="hub-cats__label">{{ item.label }}</span>
        <span class="hub-cats__state" :class="`is-${item.state.tone}`">{{ item.state.text }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hub-cats {
  padding: 14px 16px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: $radius-lg;
  background: var(--el-bg-color);
  box-shadow: $shadow-sm;
}

.hub-cats__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.hub-cats__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  svg {
    color: var(--el-color-primary);
  }
}

.hub-cats__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* 分类数固定时按列排齐，避免 flex 换行后末行只剩零星几个、右半边留白；
   宽屏列数由调用方传入（申报 10 项 5 列、奖项 3 项 3 列） */
.hub-cats__list {
  display: grid;
  grid-template-columns: repeat(var(--hub-cats-cols, 5), minmax(0, 1fr));
  gap: 8px 10px;
}

/* 图标块 + 名称 + 状态，激活时图标块反白 */
.hub-cats__item {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $radius-lg;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-fill-color-light);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);

    .hub-cats__icon {
      background: var(--el-color-primary);
      color: #fff;
    }

    .hub-cats__label {
      font-weight: 600;
    }

    /* 激活项的条数与品牌色同调，未填报仍保持置灰（它本身就是「还没有内容」的提示） */
    .hub-cats__state.is-count {
      color: var(--el-color-primary);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

.hub-cats__icon {
  display: grid;
  place-items: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: $radius-lg;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.hub-cats__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 只有「退回 / 待审」用彩色胶囊强调；条数与未填报退成纯文字，避免整块像一列标签 */
.hub-cats__state {
  flex-shrink: 0;
  font-size: 11px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &.is-danger {
    padding: 0 6px;
    border-radius: 999px;
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
  &.is-warning {
    padding: 0 6px;
    border-radius: 999px;
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }
  &.is-count {
    color: var(--el-text-color-secondary);
  }
  &.is-muted {
    color: var(--el-text-color-placeholder);
  }
}

/* 窄屏不再固定列数：分类总量不同的两个中心都能自然换行，避免奖项 3 项占不满 4 列 */
@media (max-width: 1100px) {
  .hub-cats__list {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  }
}

/* 窄屏：状态文案保留（它回答「哪里还没填」），只收紧列距与内边距 */
@media (max-width: 640px) {
  .hub-cats {
    padding: 12px;
  }

  .hub-cats__list {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .hub-cats__item {
    padding: 6px 8px;
  }
}
</style>
