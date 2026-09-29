<script setup lang="ts">
import type { GreetingInfo } from '@/features/dashboard/composables/useGreeting'
import { X } from 'lucide-vue-next'

defineOptions({ name: 'GreetingToast' })

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
    <Transition name="greeting-toast">
      <div
        v-if="visible"
        class="greeting-toast"
        :class="{ 'greeting-toast--dismissing': dismissing }"
      >
        <div class="greeting-toast__content">
          <span class="greeting-toast__emoji">{{ theme.emoji }}</span>
          <span class="greeting-toast__message">{{ greeting.message.replace(/\n/g, ' · ') }}</span>
        </div>
        <button
          type="button"
          class="greeting-toast__close"
          aria-label="关闭"
          @click="emit('close')"
        >
          <X :size="14" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.greeting-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-toast;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 640px;
  width: calc(100vw - 32px);
  padding: 14px 18px;
  border-radius: $radius-xl;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.14),
    0 6px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: v-bind('theme.gradient');
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    padding-left: 8px;
  }

  &__emoji {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
  }

  &__message {
    font-size: 14px;
    color: var(--el-text-color-primary);
    line-height: 1.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__close {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color);
      color: var(--el-text-color-primary);
    }
  }
}

.greeting-toast-enter-active,
.greeting-toast-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.greeting-toast-enter-from,
.greeting-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@media (max-width: 768px) {
  .greeting-toast {
    top: 12px;
    width: calc(100vw - 24px);
    padding: 10px 12px;
  }
  .greeting-toast__message {
    font-size: 13px;
  }
}
</style>
