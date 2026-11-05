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
  theme: { gradient: string }
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
          <span class="greeting-toast__message">{{ greeting.message }}</span>
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
  // 右下角上移，避开学生端的 AI 助手悬浮按钮；同时不遮挡页头、标签页和表格首行。
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: $z-toast;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 340px;
  padding: 10px 10px 10px 16px;
  border-radius: $radius-lg;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: v-bind('theme.gradient');
  }

  &__content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  &__message {
    font-size: 13px;
    color: var(--el-text-color-primary);
    line-height: 1.5;
    word-break: break-word;
  }

  &__close {
    width: 30px;
    height: 30px;
    border-radius: $radius-base;
    border: none;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover,
    &:focus-visible {
      background: var(--el-fill-color);
      color: var(--el-text-color-primary);
    }
  }
}

/* 教师端 / 管理员端：挪到左下角并压平。
   右下角 (right:24px) 会正好压住表格最后一列操作（导出页的「下载 / 删除」），
   而教师/管理员没有 AI 悬浮球需要避让，左下角是安全区。 */
html:has(.layout--teacher) .greeting-toast,
html:has(.layout--admin) .greeting-toast {
  right: auto;
  left: 24px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);

  &::before {
    background: var(--mc-info, #1d4ed8);
  }
}

.greeting-toast-enter-active,
.greeting-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.greeting-toast-enter-from,
.greeting-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 768px) {
  .greeting-toast {
    right: 12px;
    bottom: 76px;
    max-width: calc(100vw - 24px);
  }

  /* 窄屏上浮层无论放哪都会压住卡片内容，教师/管理员直接不弹，改用更省地方的提示 */
  html:has(.layout--teacher) .greeting-toast,
  html:has(.layout--admin) .greeting-toast {
    right: auto;
    left: 12px;
    display: none;
  }
}
</style>
