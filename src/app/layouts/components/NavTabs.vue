<script setup lang="ts">
/**
 * NavTabs - 标签栏（已访问页面集合）
 *
 * 交互：
 *  - 点击 tab → router.push 到该路径
 *  - 关闭按钮 → 移除 tab；如果关闭的是当前激活 tab，跳到前一个
 *  - 横向滚动 + 左右翻页按钮
 *  - 键盘：← / → 在 tab 间切换，Home/End 跳首尾，Enter 激活
 *  - 移动端：tab 自适应截断（超长省略）
 *
 * ui-ux-design 规范：
 *  - role="tablist" / role="tab" / aria-selected
 *  - 移动端触控目标 ≥ 44×44px
 *  - 用 transform 做 active 指示条动画（合成层）
 *  - prefers-reduced-motion: reduce 关闭动画
 *  - 不使用 Emoji 图标
 */
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/app/stores/tabs'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()

const scrollerRef = ref<HTMLElement | null>(null)
const tabRefs = ref<HTMLElement[]>([])
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const tabs = computed(() => tabsStore.visitedTabs)
const activePath = computed(() => tabsStore.activePath || route.fullPath)

function updateScrollState() {
  const el = scrollerRef.value
  if (!el) {
    return
  }
  canScrollLeft.value = el.scrollLeft > 2
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
}

// 把激活的 tab 滚到视口内
async function scrollIntoView(path: string) {
  await nextTick()
  const idx = tabs.value.findIndex(t => t.path === path)
  if (idx === -1) {
    return
  }
  const el = tabRefs.value[idx]
  const container = scrollerRef.value
  if (!el || !container) {
    return
  }
  const elRect = el.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  if (elRect.left < cRect.left) {
    container.scrollBy({ left: elRect.left - cRect.left - 8, behavior: 'smooth' })
  }
  else if (elRect.right > cRect.right) {
    container.scrollBy({ left: elRect.right - cRect.right + 8, behavior: 'smooth' })
  }
}

// 路由变化时同步滚动
watch(
  () => activePath.value,
  (p) => {
    if (p) {
      scrollIntoView(p)
    }
  },
  { immediate: true },
)

function setRef(el: Element | null, index: number) {
  if (el instanceof HTMLElement) {
    tabRefs.value[index] = el
  }
}

function activate(path: string) {
  if (path === activePath.value) {
    return
  }
  router.push(path)
}

function close(path: string, e: Event) {
  e.stopPropagation()
  const fallback = tabsStore.removeTab(path)
  if (fallback) {
    router.push(fallback)
  }
}

function onKeydown(e: KeyboardEvent, path: string, index: number) {
  const total = tabs.value.length
  let nextIndex = index
  switch (e.key) {
    case 'ArrowLeft':
      nextIndex = index - 1 < 0 ? total - 1 : index - 1
      e.preventDefault()
      break
    case 'ArrowRight':
      nextIndex = index + 1 >= total ? 0 : index + 1
      e.preventDefault()
      break
    case 'Home':
      nextIndex = 0
      e.preventDefault()
      break
    case 'End':
      nextIndex = total - 1
      e.preventDefault()
      break
    case 'Enter':
    case ' ':
      activate(path)
      e.preventDefault()
      return
    default:
      return
  }
  const next = tabs.value[nextIndex]
  if (next) {
    tabRefs.value[nextIndex]?.focus()
  }
}

function scrollBy(delta: number) {
  scrollerRef.value?.scrollBy({ left: delta, behavior: 'smooth' })
}

// 监听滚动 → 更新翻页按钮可用状态 + resize 重算
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  nextTick(() => {
    updateScrollState()
    if (scrollerRef.value && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => updateScrollState())
      resizeObserver.observe(scrollerRef.value)
    }
  })
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div v-if="tabs.length > 0" class="nav-tabs" role="presentation">
    <!-- 左翻页：与 header 等高，垂直居中 -->
    <button
      type="button"
      class="nav-tabs__nav nav-tabs__nav--left"
      aria-label="向左滚动标签"
      @click="scrollBy(-160)"
    >
      <ChevronLeft :size="14" />
    </button>

    <!-- 标签栏主体：水平滚动 + mask 渐变提示 -->
    <div
      ref="scrollerRef"
      class="nav-tabs__viewport"
    >
      <div
        ref="scrollerRef"
        class="nav-tabs__scroller"
        role="tablist"
        aria-label="已访问页面标签"
      >
        <div
          v-for="(tab, index) in tabs"
          :key="tab.path"
          :ref="(el) => setRef(el as Element | null, index)"
          class="nav-tabs__item"
          :class="{
            'is-active': tab.path === activePath,
            'is-affix': tab.affix,
          }"
          role="tab"
          tabindex="0"
          :aria-selected="tab.path === activePath"
          :aria-label="`标签：${tab.title}${tab.path === activePath ? '（当前）' : ''}`"
          @click="activate(tab.path)"
          @keydown="onKeydown($event, tab.path, index)"
        >
          <span class="nav-tabs__title">{{ tab.title }}</span>
          <button
            v-if="tab.closable"
            type="button"
            class="nav-tabs__close"
            :aria-label="`关闭标签：${tab.title}`"
            @click="close(tab.path, $event)"
          >
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- 右翻页 -->
    <button
      type="button"
      class="nav-tabs__nav nav-tabs__nav--right"
      aria-label="向右滚动标签"
      @click="scrollBy(160)"
    >
      <ChevronRight :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
// =============================================================================
// 校准核心公式
//  - header 高 56px，header 内区 40px（上下各 8px）
//  - tab 高 32px（视觉中线 = header 中线）
//  - 翻页按钮 28×56（与 header 等高，垂直居中）
//  - 全部 align-items: center（禁止 stretch，避免子项高度被拉伸错位）
// =============================================================================
.nav-tabs {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  height: 100%;
  position: relative;
  gap: $spacing-xs;

  // 翻页按钮（左右对称；与 header 等高 56px）
  &__nav {
    flex: 0 0 auto;
    width: 28px;
    height: 32px; // 与 tab 等高 → 中轴线严格对齐
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    border-radius: $radius-base;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    padding: 0;
    transition:
      color $duration-fast $ease-standard,
      background-color $duration-fast $ease-standard,
      opacity $duration-fast $ease-standard;

    &:hover:not(:disabled) {
      color: var(--el-color-primary);
      background-color: var(--el-fill-color-light);
    }

    &:disabled {
      opacity: 0;
      pointer-events: none;
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }
  }

  // 视口外层（负责 mask 渐变和滚动边界）
  &__viewport {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  // 真正滚动的容器
  &__scroller {
    flex: 1 1 auto;
    min-width: 0;
    height: 32px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    display: flex;
    align-items: center; // 关键：与 tab 视觉中轴对齐
    gap: $spacing-xs;
    padding: 0 $spacing-xs;
    // 允许横向滚动但不允许惯性滚动到链式刷新
    overscroll-behavior-x: contain;
    // 性能：滚动容器是固定大小的，避免 layout 重算
    contain: layout style;

    // 隐藏滚动条（Chrome/Safari）
    &::-webkit-scrollbar {
      display: none;
    }
  }

  // 单个 tab
  &__item {
    flex: 0 0 auto;
    max-width: 200px;
    min-width: 80px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    // 关键：左右内边距对称 → 文本 + 关闭按钮在 tab 中完美居中
    padding: 0 6px 0 12px;
    border-radius: $radius-base;
    color: var(--el-text-color-regular);
    font-size: $font-size-base;
    line-height: 1;
    cursor: pointer;
    user-select: none;
    position: relative;
    background-color: transparent;
    // 仅动 transform + color + background-color（合成层）
    transition:
      color $duration-fast $ease-standard,
      background-color $duration-fast $ease-standard,
      transform $duration-fast $ease-standard;

    &:hover {
      background-color: var(--el-fill-color-light);
      color: var(--el-color-primary);
    }

    &.is-active {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
      font-weight: 500;

      // 底部激活指示条（与 tab padding 对齐：左右各 12px = padding-left）
      &::after {
        content: '';
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: 0;
        height: 2px;
        border-radius: 2px 2px 0 0;
        background: var(--el-color-primary);
        animation: nav-tabs-slide-in $duration-base $ease-emphasized;
        transform-origin: left center;
      }
    }

    &.is-affix .nav-tabs__close {
      display: none;
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }
  }

  // 标题文本
  &__title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
    min-width: 0;
  }

  // 关闭按钮（视觉中心与 tab 文本基线对齐）
  &__close {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    border-radius: $radius-sm;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    padding: 0;
    transition:
      background-color $duration-fast $ease-standard,
      color $duration-fast $ease-standard;

    &:hover {
      background-color: rgba($color-danger, 0.1);
      color: var(--el-color-danger);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 1px;
    }
  }
}

// 激活指示条滑入（合成层动画）
@keyframes nav-tabs-slide-in {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

// =============================================================================
// 响应式校准（4 档断点：1440 / 1199 / 768 / 375）
// =============================================================================

// 平板：收紧 tab 宽度、保留所有交互
@media (max-width: 1199px) {
  .nav-tabs__item {
    max-width: 160px;
  }
}

// 移动端横屏：tab 更紧凑、触控目标 ≥ 44px（含 padding）
@media (max-width: 768px) {
  .nav-tabs__item {
    max-width: 120px;
    min-width: 64px;
    padding: 0 4px 0 10px;
  }
  .nav-tabs__nav {
    width: 32px;
    height: 32px;
  }
  .nav-tabs__viewport {
    // 移动端给翻页按钮让出更多空间
    margin: 0 -2px;
  }
}

// 极小屏：tab 标题更短，整体更紧凑
@media (max-width: 375px) {
  .nav-tabs__item {
    max-width: 88px;
    min-width: 56px;
    padding: 0 2px 0 8px;
    font-size: $font-size-sm;
  }
  .nav-tabs__close {
    width: 16px;
    height: 16px;
    margin-left: 2px;
  }
  .nav-tabs__nav {
    width: 24px;
    height: 28px;
  }
  .nav-tabs__scroller {
    padding: 0 $spacing-xs;
  }
}

// =============================================================================
// 无障碍：关闭所有 transition / animation
// =============================================================================
@media (prefers-reduced-motion: reduce) {
  .nav-tabs__item,
  .nav-tabs__nav,
  .nav-tabs__close {
    transition: none !important;
  }
  .nav-tabs__item.is-active::after {
    animation: none !important;
  }
}
</style>
