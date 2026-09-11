<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'
import { useFloatingBallPosition } from '../composables/useFloatingBallPosition'

defineOptions({ name: 'AIFloatingBall' })

const props = withDefaults(
  defineProps<{
    unreadCount?: number
    open?: boolean
  }>(),
  {
    unreadCount: 0,
    open: false,
  },
)

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const userStore = useUserStore()
const { x, y, ballSize, isDragging, wasDragging, onPointerDown } = useFloatingBallPosition()

const visible = computed(() => !route.path.startsWith('/ai-chat'))

const badgeText = computed(() => {
  if (!props.unreadCount || props.unreadCount <= 0) return ''
  return props.unreadCount > 9 ? '9+' : String(props.unreadCount)
})

const greeting = computed(() => {
  const name = userStore.userName || '同学'
  return `你好，${name}，有问题随时问我~`
})

const ballStyle = computed(() => ({
  width: `${ballSize.value}px`,
  height: `${ballSize.value}px`,
  left: `${x.value}px`,
  bottom: `${y.value}px`,
}))

function handleClick() {
  // 拖拽时不触发 click
  if (wasDragging.value) {
    wasDragging.value = false
    return
  }
  emit('toggle')
}
</script>

<template>
  <div
    v-if="visible"
    class="ai-fb"
    :class="{
      'ai-fb--open': props.open,
      'ai-fb--dragging': isDragging,
    }"
    :style="ballStyle"
    :data-tooltip="greeting"
    :aria-label="greeting"
    role="button"
    tabindex="0"
    @pointerdown="onPointerDown"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <Sparkles :size="Math.round(ballSize * 0.43)" class="ai-fb__icon" />

    <!-- 未读角标 -->
    <span v-if="badgeText" class="ai-fb__badge">{{ badgeText }}</span>

    <!-- 问候 tooltip -->
    <span class="ai-fb__tooltip" aria-hidden="true">{{ greeting }}</span>
  </div>
</template>

<style scoped lang="scss">
.ai-fb {
  position: fixed;
  bottom: 0;
  left: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--mc-primary) 0%, var(--mc-primary-light) 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  transition:
    box-shadow $duration-base $ease-standard,
    transform $duration-base $ease-standard;

  // 呼吸动画
  animation: aiFbBreathe 3s ease-in-out infinite;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    transform: scale(1.05);
    animation: none;

    .ai-fb__tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }

  &:active {
    transform: scale(0.95);
  }

  &--open {
    transform: scale(1);
    animation: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  // --- 图标 ---
  &__icon {
    pointer-events: none;
  }

  // --- 未读角标 ---
  &__badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--el-color-danger);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
  }

  // --- 问候 tooltip ---
  &__tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    right: 0;
    white-space: nowrap;
    padding: 8px 14px;
    background: rgba(0, 0, 0, 0.78);
    color: #fff;
    font-size: 13px;
    border-radius: 8px;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transform: translateY(6px);
    transition:
      opacity $duration-fast $ease-standard,
      visibility $duration-fast $ease-standard,
      transform $duration-fast $ease-decelerate;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      right: 18px;
      border: 5px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.78);
    }
  }
}

// 呼吸动画
@keyframes aiFbBreathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

// 移动端适配
@media (max-width: 768px) {
  .ai-fb {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    &__tooltip {
      display: none;
    }
  }
}

// 减少动画偏好
@media (prefers-reduced-motion: reduce) {
  .ai-fb {
    animation: none;
    transition: none;

    &:hover {
      transform: none;
    }

    &__tooltip {
      transition: none;
    }
  }
}
</style>
