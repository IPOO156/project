<script setup lang="ts">
import type { ChatMessage } from '../types'
/**
 * ChatMessages - 消息区容器
 *
 * - v-for 渲染 MessageBubble
 * - loading 时显示 thinking 指示器（AI Thinking... + 脉冲图标）
 * - 自动滚动到底部（messages 变化 + loading 出现时）
 */
import { Sparkles } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  messages: ChatMessage[]
  loading: boolean
  /** 是否显示思考动画（设置项） */
  showThinking: boolean
  /** 是否显示消息反馈（设置项） */
  showFeedback: boolean
  /** 用户姓名（传给 MessageBubble 作头像） */
  userName: string
}>()

const emit = defineEmits<{
  feedback: [msgId: string, type: 'useful' | 'useless']
  copy: [msgId: string]
}>()

const scrollRef = ref<HTMLElement | null>(null)

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 消息数变化或 loading 出现时滚动
watch(() => props.messages.length, scrollToBottom)
watch(
  () => props.loading,
  (v) => {
    if (v) scrollToBottom()
  },
)

// 显示 thinking 时也滚动（避免指示器超出视口）
watch(() => props.showThinking, scrollToBottom)
</script>

<template>
  <div ref="scrollRef" class="cm">
    <div class="cm__inner">
      <MessageBubble
        v-for="msg in props.messages"
        :key="msg.id"
        :message="msg"
        :user-name="props.userName"
        :show-feedback="props.showFeedback"
        @feedback="(t) => emit('feedback', msg.id, t)"
        @copy="emit('copy', msg.id)"
      />

      <Transition name="think">
        <div v-if="props.loading && props.showThinking" class="cm__thinking">
          <div class="cm__thinking-avatar">
            <Sparkles :size="18" />
          </div>
          <div class="cm__thinking-bubble">
            <Sparkles :size="14" class="cm__thinking-icon" />
            <span>AI Thinking...</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cm {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-xl;
  scroll-behavior: smooth;

  &__inner {
    max-width: 880px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__thinking {
    display: flex;
    gap: $spacing-sm;
    align-items: flex-start;
  }

  &__thinking-avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--mc-primary), var(--mc-primary-light));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__thinking-bubble {
    display: inline-flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-lg;
    border-top-left-radius: $radius-sm;
    color: var(--el-text-color-secondary);
  }

  &__thinking-icon {
    color: var(--mc-primary);
    animation: thinkingPulse 1.6s $ease-standard infinite;
  }
}

@keyframes thinkingPulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

.think-enter-active,
.think-leave-active {
  transition: opacity $duration-base $ease-standard;
}

.think-enter-from,
.think-leave-to {
  opacity: 0;
}
</style>
