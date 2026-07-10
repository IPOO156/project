<script setup lang="ts">
/**
 * NavTabs - 标签栏（已访问页面集合）
 *
 * 交互：
 *  - 点击 tab → router.push 到该路径
 *  - 关闭按钮 → 移除 tab；如果关闭的是当前激活 tab，跳到前一个
 *  - 横向滚动（鼠标滚轮/触摸滑动），不显示左右翻页按钮
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
import { X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { isNavigationFailure, NavigationFailureType, useRoute, useRouter } from 'vue-router'
import { useTabsStore } from '@/app/stores/tabs'
import { findMenuItemByPath } from '@/shared/constants/menu'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()

const scrollerRef = ref<HTMLElement | null>(null)
const tabRefs = ref<HTMLElement[]>([])

const tabs = computed(() => tabsStore.visitedTabs)
const activePath = computed(() => tabsStore.activePath || route.fullPath)

// 固定标签数量：固定标签始终在最左侧，不参与拖拽排序
const affixCount = computed(() => tabs.value.filter((t) => t.affix).length)

// 拖拽状态
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

/**
 * 解析 tab 图标。
 * - 优先使用状态中的 icon（运行时已解析）
 * - 状态缺失时（如刷新后从 sessionStorage 恢复），fallback 到菜单配置
 */
function getTabIcon(tab: (typeof tabs.value)[number]) {
  return tab.icon ?? findMenuItemByPath(tab.path)?.icon
}

function onDragStart(index: number) {
  // 固定标签不可拖动
  if (tabs.value[index]?.affix) {
    return
  }
  dragIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  // 禁止放置到固定标签位置（保持固定标签始终在最左侧）
  if (index < affixCount.value) {
    dropIndex.value = null
    return
  }
  dropIndex.value = index
}

function onDrop(e: DragEvent, index: number) {
  e.preventDefault()
  if (
    dragIndex.value === null ||
    dragIndex.value < affixCount.value ||
    index < affixCount.value ||
    dragIndex.value === index
  ) {
    dragIndex.value = null
    dropIndex.value = null
    return
  }
  const newTabs = [...tabs.value]
  const [moved] = newTabs.splice(dragIndex.value, 1)
  newTabs.splice(index, 0, moved)
  tabsStore.reorderTabs(newTabs)
  dragIndex.value = null
  dropIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dropIndex.value = null
}

// 把激活的 tab 滚到视口内
async function scrollIntoView(path: string) {
  await nextTick()
  const idx = tabs.value.findIndex((t) => t.path === path)
  if (idx === -1) {
    return
  }
  const el = tabRefs.value[idx]
  if (!el) {
    return
  }
  // 等浏览器完成首次样式计算与 layout 后再滚动，避免强制同步布局
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  })
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

async function activate(path: string) {
  if (path === activePath.value) {
    return
  }
  try {
    const failure = await router.push(path)
    if (failure && !isNavigationFailure(failure, NavigationFailureType.cancelled)) {
      console.warn('[NavTabs] 激活标签导航失败:', failure)
    }
  } catch (err) {
    console.error('[NavTabs] 激活标签失败:', err)
  }
}

async function close(path: string, e: Event) {
  e.stopPropagation()
  const isClosingActive = path === activePath.value
  const fallback = tabsStore.removeTab(path)
  if (!isClosingActive || !fallback) {
    return
  }
  try {
    const failure = await router.push(fallback)
    if (failure && !isNavigationFailure(failure, NavigationFailureType.cancelled)) {
      console.warn('[NavTabs] 关闭标签后导航失败:', failure)
    }
  } catch (err) {
    console.error('[NavTabs] 关闭标签后跳转失败:', err)
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
</script>

<template>
  <div v-if="tabs.length > 0" class="nav-tabs" role="presentation">
    <!-- 标签栏主体：水平滚动 + mask 渐变提示 -->
    <div class="nav-tabs__viewport">
      <div ref="scrollerRef" class="nav-tabs__scroller" role="tablist" aria-label="已访问页面标签">
        <div
          v-for="(tab, index) in tabs"
          :key="tab.path"
          :ref="(el) => setRef(el as Element | null, index)"
          class="nav-tabs__item"
          :class="{
            'is-active': tab.path === activePath,
            'is-affix': tab.affix,
            'is-dragging': dragIndex === index,
            'is-drop-target': dropIndex === index && dropIndex !== dragIndex,
          }"
          role="tab"
          tabindex="0"
          :draggable="!tab.affix"
          :aria-selected="tab.path === activePath"
          :aria-label="`标签：${tab.title}${tab.path === activePath ? '（当前）' : ''}`"
          @click="activate(tab.path)"
          @keydown="onKeydown($event, tab.path, index)"
          @dragstart="onDragStart(index)"
          @dragover="onDragOver($event, index)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd"
        >
          <div class="nav-tabs__surface">
            <component
              :is="getTabIcon(tab)"
              v-if="getTabIcon(tab)"
              :size="14"
              class="nav-tabs__icon"
              aria-hidden="true"
            />
            <span class="nav-tabs__title" :title="tab.title">{{ tab.title }}</span>
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
    </div>
  </div>
</template>

<style scoped lang="scss">
// =============================================================================
// 校准核心公式
//  - header 高 56px，header 内区 40px（上下各 8px）
//  - tab 高 32px（视觉中线 = header 中线）
//  - 全部 align-items: center（禁止 stretch，避免子项高度被拉伸错位）
// =============================================================================
.nav-tabs {
  --tab-base-width: 168px;
  --tab-min-width: 80px;

  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  height: 100%;
  position: relative;
  gap: $spacing-xs;

  &__viewport {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  &__scroller {
    flex: 1 1 auto;
    min-width: 0;
    height: 34px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 4px;
    overscroll-behavior-x: contain;
    contain: layout style;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__item,
  &__surface {
    box-sizing: border-box;
  }

  &__item {
    flex: 0 1 var(--tab-base-width);
    min-width: var(--tab-min-width);
    max-width: var(--tab-base-width);
    height: 34px;
    padding: 0;
    background: transparent;
    color: var(--el-text-color-regular);
    font-size: $font-size-base;
    line-height: 1;
    cursor: pointer;
    user-select: none;
    position: relative;

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 2px;
    }

    &.is-affix .nav-tabs__close {
      display: none;
    }
  }

  &__surface {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 10px 0 12px;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 10px 10px 0 0;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(241, 245, 249, 0.82));
    position: relative;
    // 为关闭按钮绝对定位提供锚点
    contain: layout style;
    transition:
      background-color $duration-fast $ease-standard,
      border-color $duration-fast $ease-standard,
      box-shadow $duration-fast $ease-standard,
      transform $duration-fast $ease-standard,
      color $duration-fast $ease-standard;

    &::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 0;
      height: 2px;
      background: var(--el-color-primary);
      border-radius: 2px 2px 0 0;
      transform: scaleX(0);
      transform-origin: center;
      transition: transform $duration-fast $ease-standard;
    }
  }

  &__icon {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    color: currentColor;
    opacity: 0.8;
  }

  &__item:hover .nav-tabs__surface {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(96, 165, 250, 0.28);
    color: var(--el-color-primary);
  }

  &__item.is-active .nav-tabs__surface {
    background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(248, 250, 252, 0.98));
    border-color: rgba(96, 165, 250, 0.32);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    color: var(--el-color-primary);

    &::after {
      transform: scaleX(1);
    }
  }

  &__title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
    min-width: 0;
    // 为关闭按钮预留空间，避免 hover 时文字被挤压
    margin-right: 26px;
  }

  &__close {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
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
    opacity: 0;
    pointer-events: none;
    transition:
      background-color $duration-fast $ease-standard,
      color $duration-fast $ease-standard,
      opacity $duration-fast $ease-standard;

    &:hover {
      background-color: rgba($color-danger, 0.1);
      color: var(--el-color-danger);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 1px;
      opacity: 1;
      pointer-events: auto;
    }
  }

  &__item.is-active .nav-tabs__close,
  &__item:hover .nav-tabs__close {
    opacity: 1;
    pointer-events: auto;
  }

  // 拖拽状态
  &__item.is-dragging .nav-tabs__surface {
    opacity: 0.4;
    transform: scale(0.96);
    cursor: grabbing;
  }

  &__item.is-drop-target .nav-tabs__surface {
    border-color: var(--el-color-primary);
    background: rgba(96, 165, 250, 0.08);
  }
}

@media (max-width: 768px) {
  .nav-tabs {
    --tab-base-width: 140px;
    --tab-min-width: 72px;
  }

  .nav-tabs__surface {
    padding: 0 8px 0 10px;
  }

  .nav-tabs__title {
    margin-right: 22px;
  }
}

@media (max-width: 375px) {
  .nav-tabs {
    --tab-base-width: 120px;
    --tab-min-width: 64px;
  }

  .nav-tabs__surface {
    padding: 0 6px 0 8px;
  }

  .nav-tabs__title {
    font-size: $font-size-sm;
    margin-right: 18px;
  }

  .nav-tabs__close {
    width: 16px;
    height: 16px;
    right: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-tabs__item,
  .nav-tabs__surface,
  .nav-tabs__close {
    transition: none !important;
  }
}
</style>

<style lang="scss">
/* 暗色模式：覆盖标签栏为深色系 */
html.dark .nav-tabs {
  &__surface {
    border-color: rgba(148, 163, 184, 0.18);
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.88));
    color: var(--el-text-color-secondary);
  }

  &__item:hover .nav-tabs__surface {
    background: rgba(51, 65, 85, 0.96);
    border-color: rgba(96, 165, 250, 0.35);
    color: var(--el-color-primary);
  }

  &__item.is-active .nav-tabs__surface {
    background: linear-gradient(180deg, rgba(30, 41, 59, 1), rgba(30, 41, 59, 0.98));
    border-color: rgba(96, 165, 250, 0.45);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    color: var(--el-color-primary);
  }

  &__close {
    color: var(--el-text-color-secondary);

    &:hover {
      background-color: rgba(239, 68, 68, 0.15);
      color: var(--el-color-danger);
    }
  }
}
</style>
