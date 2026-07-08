<script setup lang="ts">
import type { GreetingInfo } from '@/features/dashboard/composables/useGreeting'
import { X } from 'lucide-vue-next'

defineOptions({ name: 'GreetingDialog' })

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

interface Props {
  visible: boolean
  dismissing: boolean
  greeting: GreetingInfo
  theme: { gradient: string; emoji: string }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="greeting-fade">
      <div
        v-if="visible"
        class="greeting-overlay"
        :class="{ 'greeting-overlay--dismissing': dismissing }"
        @click.self="emit('close')"
      >
        <div class="greeting-dialog" :class="`greeting-dialog--${greeting.period}`">
          <!-- 装饰顶部色带 -->
          <div class="greeting-dialog__ribbon" :style="{ background: theme.gradient }" />

          <!-- 关闭按钮 -->
          <button
            type="button"
            class="greeting-dialog__close"
            aria-label="关闭"
            @click="emit('close')"
          >
            <X :size="18" />
          </button>

          <!-- 内容区域 -->
          <div class="greeting-dialog__body">
            <div class="greeting-dialog__emoji">{{ theme.emoji }}</div>
            <div class="greeting-dialog__message" role="heading" aria-level="3">
              {{ greeting.message }}
            </div>
            <button type="button" class="greeting-dialog__confirm" @click="emit('close')">
              开始新的一天
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.greeting-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.greeting-dialog {
  position: relative;
  width: 420px;
  max-width: calc(100vw - 48px);
  background: var(--el-bg-color);
  border-radius: $radius-2xl;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.18),
    0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);

  &__ribbon {
    height: 5px;
    width: 100%;
  }

  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color);
      color: var(--el-text-color-primary);
      border-color: var(--el-border-color);
    }
  }

  &__body {
    padding: 36px 40px 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  &__emoji {
    font-size: 48px;
    line-height: 1;
    animation: greetingBounce 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
  }

  &__message {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: pre-line;
    line-height: 1.8;
    min-height: 3.6em;
  }

  &__confirm {
    margin-top: 4px;
    padding: 10px 32px;
    border-radius: 100px;
    border: none;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }

  // 各时段按钮主题色：明确使用深色渐变配白字，确保对比度
  &--morning .greeting-dialog__confirm {
    background: linear-gradient(135deg, #ea580c, #d97706);
  }
  &--noon .greeting-dialog__confirm {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
  }
  &--afternoon .greeting-dialog__confirm {
    background: linear-gradient(135deg, #7c3aed, #9333ea);
  }
  &--evening .greeting-dialog__confirm {
    background: linear-gradient(135deg, #1e3a8a, #312e81);
  }
  &--night .greeting-dialog__confirm {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    box-shadow: 0 4px 14px rgba(255, 255, 255, 0.1);
  }
}

@keyframes greetingBounce {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// Transition
.greeting-fade-enter-active,
.greeting-fade-leave-active {
  transition: opacity 0.3s ease;
}

.greeting-fade-enter-active .greeting-dialog,
.greeting-fade-leave-active .greeting-dialog {
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.3s ease;
}

.greeting-fade-enter-from {
  opacity: 0;
}

.greeting-fade-enter-from .greeting-dialog {
  transform: scale(0.92) translateY(20px);
  opacity: 0;
}

.greeting-fade-leave-to {
  opacity: 0;
}

.greeting-fade-leave-to .greeting-dialog {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .greeting-fade-enter-active,
  .greeting-fade-leave-active,
  .greeting-fade-enter-active .greeting-dialog,
  .greeting-fade-leave-active .greeting-dialog {
    transition: none !important;
  }

  .greeting-fade-enter-from .greeting-dialog,
  .greeting-fade-leave-to .greeting-dialog {
    transform: none !important;
  }

  .greeting-dialog__emoji {
    animation: none !important;
  }
}

@media (max-width: 768px) {
  .greeting-dialog__body {
    padding: 28px 24px 32px;
  }
  .greeting-dialog__message {
    font-size: 16px;
  }
}
</style>
