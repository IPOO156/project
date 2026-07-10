<script setup lang="ts">
import { Send, Sparkles, X } from 'lucide-vue-next'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/app/stores/stores'
import { useAIChat } from '../composables/useAIChat'
import ChatAvatar from './ChatAvatar.vue'

defineOptions({ name: 'AIChatDrawer' })

const props = defineProps<{
  visible: boolean
  initialQuestion?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const userStore = useUserStore()
const { messages, loading, sendMessage } = useAIChat()

const inputValue = ref('')
const chatBodyRef = ref<HTMLElement | null>(null)

const quickQuestions = [
  '如何填写个人档案信息？',
  '奖项申报需要准备哪些材料？',
  '成长时间轴怎么添加经历？',
  '如何查看审批进度？',
]

const aiName = computed(() => 'AI 智能助手')

function scrollToBottom() {
  nextTick(() => {
    const el = chatBodyRef.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}

function handleSend() {
  const text = inputValue.value.trim()
  if (!text || loading.value) return
  sendMessage(text)
  inputValue.value = ''
  scrollToBottom()
}

function handleQuickQuestion(text: string) {
  sendMessage(text)
  scrollToBottom()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

function goToFullChat() {
  emit('close')
  router.push({ name: 'AIChat' })
}

function onEscKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('close')
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(scrollToBottom)
      // 如果有初始问题且当前只有欢迎语，自动发送
      // immediate: true 保证被 :key 强制重新挂载时（如 CareerPlan「重新分析」）
      // 也能在挂载即 visible=true 的情况下触发自动发送
      if (props.initialQuestion && messages.value.length <= 1) {
        sendMessage(props.initialQuestion)
      }
    }
  },
  { immediate: true },
)

onMounted(() => document.addEventListener('keydown', onEscKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onEscKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="ai-drawer">
      <div v-if="props.visible" class="ai-drawer">
        <div class="ai-drawer__backdrop" aria-hidden="true" @click="emit('close')" />
        <div class="ai-drawer__panel">
          <header class="ai-drawer__header">
            <div class="ai-drawer__header-left">
              <div class="ai-drawer__avatar"><Sparkles :size="18" /></div>
              <span class="ai-drawer__title">{{ aiName }}</span>
            </div>
            <div class="ai-drawer__header-right">
              <button type="button" class="ai-drawer__expand" @click="goToFullChat">
                展开完整对话
              </button>
              <button
                type="button"
                class="ai-drawer__close"
                aria-label="关闭"
                @click="emit('close')"
              >
                <X :size="18" />
              </button>
            </div>
          </header>

          <div ref="chatBodyRef" class="ai-drawer__body">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="ai-drawer__msg"
              :class="{ 'ai-drawer__msg--user': msg.role === 'user' }"
            >
              <ChatAvatar
                :role="msg.role"
                :src="msg.role === 'user' ? userStore.avatar : undefined"
              />
              <div class="ai-drawer__bubble">
                <p class="ai-drawer__content">{{ msg.content }}</p>
                <span class="ai-drawer__time">{{ msg.time }}</span>
              </div>
            </div>

            <div v-if="loading" class="ai-drawer__msg ai-drawer__msg--loading">
              <ChatAvatar role="ai" />
              <div class="ai-drawer__bubble ai-drawer__bubble--loading">
                <Sparkles :size="14" class="ai-drawer__thinking-icon" />
                <span>AI Thinking...</span>
              </div>
            </div>
          </div>

          <div class="ai-drawer__quick">
            <button
              v-for="q in quickQuestions"
              :key="q"
              type="button"
              class="ai-drawer__quick-btn"
              :disabled="loading"
              @click="handleQuickQuestion(q)"
            >
              {{ q }}
            </button>
          </div>

          <div class="ai-drawer__input-bar">
            <input
              v-model="inputValue"
              class="ai-drawer__input"
              placeholder="输入你的问题..."
              :disabled="loading"
              @keydown="handleKeydown"
            />
            <button
              type="button"
              class="ai-drawer__send"
              :disabled="!inputValue.trim() || loading"
              @click="handleSend"
            >
              <Send :size="16" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.ai-drawer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.32);
  }

  &__panel {
    position: relative;
    width: 380px;
    height: 560px;
    margin-right: 24px;
    margin-bottom: 96px;
    background: var(--el-bg-color);
    border-radius: $radius-xl;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 1;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--mc-primary) 0%, var(--mc-primary-light) 100%);
    color: #fff;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__title {
    font-size: 15px;
    font-weight: 600;
  }
  &__header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__expand {
    padding: 4px 10px;
    border-radius: $radius-sm;
    border: 1px solid rgba(255, 255, 255, 0.4);
    background: transparent;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: background $duration-fast $ease-standard;
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  &__close {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background $duration-fast $ease-standard;
    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__msg {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    max-width: 88%;
    &--user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }
    &--loading {
      align-self: flex-start;
    }
  }

  &__bubble {
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    line-height: 1.6;
    font-size: 13px;
    border-bottom-left-radius: 4px;
  }

  &__msg--user &__bubble {
    background: var(--mc-primary);
    color: #fff;
    border-bottom-left-radius: 14px;
    border-bottom-right-radius: 4px;
  }

  &__content {
    margin: 0;
    white-space: pre-wrap;
  }
  &__time {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    opacity: 0.5;
  }

  &__bubble--loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
  }

  &__thinking-icon {
    animation: aiDrawerPulse 1.6s ease-in-out infinite;
    color: var(--mc-primary);
  }

  @keyframes aiDrawerPulse {
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

  &__quick {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 16px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-light);
    flex-shrink: 0;
  }

  &__quick-btn {
    padding: 5px 10px;
    border-radius: 100px;
    border: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all $duration-fast $ease-standard;
    &:hover:not(:disabled) {
      border-color: var(--mc-primary);
      color: var(--mc-primary);
      background: color-mix(in srgb, var(--mc-primary) 6%, transparent);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__input-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    font-size: 13px;
    outline: none;
    transition: border-color $duration-fast $ease-standard;
    &::placeholder {
      color: var(--el-text-color-placeholder);
    }
    &:focus {
      border-color: var(--mc-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--mc-primary) 10%, transparent);
    }
    &:disabled {
      opacity: 0.5;
    }
  }

  &__send {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: none;
    background: var(--mc-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all $duration-fast $ease-standard;
    &:hover:not(:disabled) {
      background: var(--mc-primary-light);
      transform: translateY(-1px);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// 过渡动画
.ai-drawer-enter-active,
.ai-drawer-leave-active {
  .ai-drawer__backdrop {
    transition: opacity $duration-slow $ease-decelerate;
  }
  .ai-drawer__panel {
    transition:
      transform $duration-slow $ease-emphasized,
      opacity $duration-slow $ease-decelerate;
  }
}
.ai-drawer-leave-active {
  .ai-drawer__backdrop {
    transition-duration: $duration-base;
    transition-timing-function: $ease-accelerate;
  }
  .ai-drawer__panel {
    transition-duration: $duration-base;
    transition-timing-function: $ease-accelerate;
  }
}

.ai-drawer-enter-from,
.ai-drawer-leave-to {
  opacity: 0;
  .ai-drawer__backdrop {
    opacity: 0;
  }
  .ai-drawer__panel {
    transform: translateY(20px) scale(0.96);
    opacity: 0;
  }
}

// 移动端
@media (max-width: 768px) {
  .ai-drawer {
    justify-content: center;
    &__panel {
      width: 100%;
      height: 90vh;
      margin: 0;
      border-radius: $radius-xl $radius-xl 0 0;
    }
  }
  .ai-drawer-enter-from,
  .ai-drawer-leave-to {
    .ai-drawer__panel {
      transform: translateY(100%);
      opacity: 1;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-drawer-enter-active,
  .ai-drawer-leave-active {
    &,
    .ai-drawer__backdrop,
    .ai-drawer__panel {
      transition: none;
    }
  }
  .ai-drawer-enter-from,
  .ai-drawer-leave-to {
    .ai-drawer__panel {
      transform: none;
    }
  }
}
</style>
