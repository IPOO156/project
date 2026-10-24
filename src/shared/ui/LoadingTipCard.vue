<script setup lang="ts">
import type { LoadingTip } from '@/shared/constants/loadingTips'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  hideTipCategory,
  isTipFavorited,
  LOADING_TIP_CATEGORY_LABELS,
  toggleFavoriteTip,
} from '@/shared/constants/loadingTips'

const props = withDefaults(
  defineProps<{
    tip: LoadingTip
    /** 自动轮播间隔（毫秒）；悬停或聚焦时暂停 */
    rotateMs?: number
  }>(),
  { rotateMs: 4200 },
)

const emit = defineEmits<{ next: [] }>()

const categoryLabel = computed(() => LOADING_TIP_CATEGORY_LABELS[props.tip.category])
const paused = ref(false)
const favorited = ref(isTipFavorited(props.tip.id))

// 轮播换条后同步该条的收藏状态
watch(
  () => props.tip.id,
  (id) => {
    favorited.value = isTipFavorited(id)
  },
)

let rotateTimer: number | null = null

function stopRotate(): void {
  if (rotateTimer !== null) {
    window.clearInterval(rotateTimer)
    rotateTimer = null
  }
}

function startRotate(): void {
  stopRotate()
  rotateTimer = window.setInterval(() => {
    if (!paused.value) emit('next')
  }, props.rotateMs)
}

/** 手动换一条后重置计时，避免刚换完又被自动切走 */
function handleManualNext(): void {
  emit('next')
  startRotate()
}

function handleToggleFavorite(): void {
  favorited.value = toggleFavoriteTip(props.tip.id)
  ElMessage.success(favorited.value ? '已收藏这条建议' : '已取消收藏')
}

/** 屏蔽当前主题并立刻换一条；若只剩一个主题则拒绝 */
function handleHideCategory(): void {
  if (!hideTipCategory(props.tip.category)) {
    ElMessage.warning('至少保留一个提示主题')
    return
  }
  ElMessage.success(`已屏蔽「${categoryLabel.value}」类提示，可在「学习建议」里恢复`)
  emit('next')
}

onMounted(startRotate)
onBeforeUnmount(stopRotate)
</script>

<template>
  <aside
    class="loading-tip"
    :data-category="tip.category"
    aria-live="off"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
    @focusin="paused = true"
    @focusout="paused = false"
  >
    <header class="loading-tip__head">
      <span class="loading-tip__label">温馨提示</span>
      <span class="loading-tip__category">{{ categoryLabel }}</span>
    </header>

    <Transition name="loading-tip-swap" mode="out-in">
      <p :key="tip.id" class="loading-tip__text">
        {{ tip.text }}
      </p>
    </Transition>

    <footer class="loading-tip__actions">
      <button class="loading-tip__action" type="button" @click="handleToggleFavorite">
        {{ favorited ? '已收藏' : '收藏' }}
      </button>
      <button class="loading-tip__action" type="button" @click="handleHideCategory">
        屏蔽此类
      </button>
      <button class="loading-tip__action loading-tip__next" type="button" @click="handleManualNext">
        换一条
      </button>
    </footer>
  </aside>
</template>

<style scoped lang="scss">
/* 书签质感：左侧竖条 + 纸面底色，与书册指针形成同一套视觉语言 */
.loading-tip {
  position: relative;
  width: min(440px, calc(100vw - 48px));
  margin-top: $spacing-lg;
  padding: $spacing-lg $spacing-xl $spacing-xl;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: $radius-xl;
  background: var(--el-bg-color-overlay);
  box-shadow: $shadow-base;
  text-align: left;
  animation: loading-tip-in $duration-slow $ease-decelerate both;
  animation-delay: 120ms;

  &::before {
    content: '';
    position: absolute;
    top: $spacing-lg;
    bottom: $spacing-lg;
    left: 0;
    width: 3px;
    border-radius: 999px;
    background: var(--el-color-primary);
  }

  /* 主题强调色：成长/实习（绿）、大学/教学/创业（琥珀）、其余沿用主色 */
  &[data-category='growth'],
  &[data-category='internship'] {
    &::before {
      background: var(--el-color-success);
    }

    .loading-tip__category {
      color: var(--el-color-success);
      background: var(--el-color-success-light-9);
    }
  }

  &[data-category='college'],
  &[data-category='teaching'],
  &[data-category='startup'] {
    &::before {
      background: var(--el-color-warning);
    }

    .loading-tip__category {
      color: var(--el-color-warning);
      background: var(--el-color-warning-light-9);
    }
  }
}

.loading-tip__head {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.loading-tip__label {
  color: var(--el-text-color-secondary);
  font-size: $font-size-xs;
  letter-spacing: 0.12em;
}

.loading-tip__category {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: $font-size-xs;
  line-height: 1.6;
}

.loading-tip__text {
  // 预留两行高度，轮播时避免卡片高度跳动
  min-height: 3.4em;
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: $font-size-sm;
  line-height: 1.75;
}

.loading-tip__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $spacing-md;
  margin-top: $spacing-sm;
}

.loading-tip__action {
  padding: 2px 4px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: $font-size-xs;
  cursor: pointer;
  transition: color $duration-fast $ease-standard;

  &:hover {
    color: var(--el-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
    border-radius: $radius-sm;
  }
}

.loading-tip__next {
  color: var(--el-color-primary);
}

.loading-tip-swap-enter-active,
.loading-tip-swap-leave-active {
  transition:
    opacity $duration-fast $ease-standard,
    transform $duration-fast $ease-standard;
}

.loading-tip-swap-enter-from {
  opacity: 0;
  transform: translateY(3px);
}

.loading-tip-swap-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

@keyframes loading-tip-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
