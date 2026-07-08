<script setup lang="ts">
import { Send, Sparkles, User } from 'lucide-vue-next'
import { nextTick, ref } from 'vue'
import { useUserStore } from '@/app/stores/stores'
import PageContainer from '@/shared/ui/PageContainer.vue'

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  time: string
}

const messages = ref<ChatMessage[]>([
  {
    id: 'welcome',
    role: 'ai',
    content:
      '你好！我是你的档案智能助手，可以帮你解答关于个人档案、奖项申报、成长记录等方面的问题。',
    time: formatTime(new Date()),
  },
])

const inputValue = ref('')
const loading = ref(false)
const chatBodyRef = ref<HTMLElement | null>(null)
const userStore = useUserStore()

const quickQuestions = [
  '如何填写个人档案信息？',
  '奖项申报需要准备哪些材料？',
  '成长时间轴怎么添加经历？',
  '如何查看审批进度？',
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  nextTick(() => {
    const el = chatBodyRef.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  })
}

function simulateAIReply(userText: string): string {
  const lower = userText.toLowerCase()
  if (lower.includes('档案') || lower.includes('个人')) {
    return '你可以在「个人中心 → 个人档案信息」页面查看和编辑基本资料。点击头像可以更换照片，基本资料支持直接修改保存。'
  }
  if (lower.includes('奖项') || lower.includes('申报') || lower.includes('报名')) {
    return '奖项申报请进入「奖项报名」模块，选择对应类别后填写信息并上传佐证材料。提交后可在「消息中心」查看审批提醒。'
  }
  if (lower.includes('成长') || lower.includes('时间轴') || lower.includes('经历')) {
    return '在「成长时间轴」页面点击中央的年轮原子核即可添加经历。经历会按学期自动排序到对应的年轮圈上。'
  }
  if (lower.includes('审批') || lower.includes('进度') || lower.includes('审核')) {
    return '提交记录可在「审批与记录 → 提交记录」中查看。审批状态变更时，系统会通过消息中心推送提醒。'
  }
  if (lower.includes('密码') || lower.includes('登录')) {
    return '如需修改密码，请前往「个人中心 → 修改密码」页面。登录时请注意大小写锁定状态。'
  }
  return '这个问题我暂时无法给出具体答案。你可以联系辅导员或系统管理员获取帮助，也可以尝试描述得更详细一些。'
}

function pushUserMessage(text: string) {
  messages.value.push({
    id: `u-${Date.now()}`,
    role: 'user',
    content: text,
    time: formatTime(new Date()),
  })
}

function pushAIMessage(content: string) {
  messages.value.push({
    id: `ai-${Date.now()}`,
    role: 'ai',
    content,
    time: formatTime(new Date()),
  })
}

function handleSend() {
  const text = inputValue.value.trim()
  if (!text || loading.value) return
  pushUserMessage(text)
  inputValue.value = ''
  scrollToBottom()

  loading.value = true
  setTimeout(() => {
    pushAIMessage(simulateAIReply(text))
    loading.value = false
    scrollToBottom()
  }, 800)
}

function handleQuickQuestion(text: string) {
  pushUserMessage(text)
  scrollToBottom()
  loading.value = true
  setTimeout(() => {
    pushAIMessage(simulateAIReply(text))
    loading.value = false
    scrollToBottom()
  }, 800)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <PageContainer class="ai-chat">
    <header class="ai-chat__header">
      <div class="ai-chat__brand">
        <div class="ai-chat__icon">
          <Sparkles :size="26" />
        </div>
        <div>
          <h1 class="ai-chat__title">AI 智能助手</h1>
          <p class="ai-chat__subtitle">解答档案、申报、成长记录相关问题</p>
        </div>
      </div>
    </header>

    <div class="ai-chat__card">
      <div ref="chatBodyRef" class="ai-chat__body">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="ai-chat__message"
          :class="{ 'ai-chat__message--user': msg.role === 'user' }"
        >
          <div
            class="ai-chat__avatar"
            :class="{
              'ai-chat__avatar--user': msg.role === 'user',
              'ai-chat__avatar--ai': msg.role === 'ai',
            }"
          >
            <template v-if="msg.role === 'user'">
              <img
                v-if="userStore.avatar"
                :src="userStore.avatar"
                alt="用户头像"
                class="ai-chat__avatar-img"
              />
              <User v-else :size="18" />
            </template>
            <Sparkles v-else :size="18" />
          </div>
          <div class="ai-chat__bubble">
            <p class="ai-chat__content">{{ msg.content }}</p>
            <span class="ai-chat__time">{{ msg.time }}</span>
          </div>
        </div>

        <div v-if="loading" class="ai-chat__message ai-chat__message--loading">
          <div class="ai-chat__avatar ai-chat__avatar--ai">
            <Sparkles :size="18" />
          </div>
          <div class="ai-chat__bubble ai-chat__bubble--loading">
            <Sparkles :size="16" class="ai-chat__thinking-icon" />
            <span>AI Thinking...</span>
          </div>
        </div>
      </div>

      <div class="ai-chat__quick">
        <button
          v-for="q in quickQuestions"
          :key="q"
          type="button"
          class="ai-chat__quick-btn"
          @click="handleQuickQuestion(q)"
        >
          {{ q }}
        </button>
      </div>

      <div class="ai-chat__input-bar">
        <input
          v-model="inputValue"
          class="ai-chat__input"
          placeholder="输入你的问题，按回车发送..."
          @keydown="handleKeydown"
        />
        <button
          type="button"
          class="ai-chat__send"
          :disabled="!inputValue.trim() || loading"
          @click="handleSend"
        >
          <Send :size="18" />
        </button>
      </div>
    </div>
  </PageContainer>
</template>

<style scoped lang="scss">
:deep(.page-container__body) {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  align-items: center;
  height: calc(100vh - #{$header-height} - 50px);
  padding: 16px;
}

.ai-chat {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  user-select: none;

  &__header {
    background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-light) 100%);
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-xl;
    padding: 24px 28px;
    margin-bottom: 28px;
    box-shadow: 0 4px 20px rgba(var(--gt-shadow-rgb, 26 18 10), 0.06);
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px rgba(64, 128, 255, 0.15);
  }

  &__title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__subtitle {
    margin: 6px 0 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__card {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    min-height: 360px;
    max-height: min(600px, calc(100vh - #{$header-height} - 260px));
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: $radius-xl;
    box-shadow: 0 4px 20px rgba(var(--gt-shadow-rgb, 26 18 10), 0.06);
    overflow: hidden;
  }

  &__body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  &__message {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: min(640px, 62%);
    width: fit-content;

    &--user {
      align-self: flex-end;
      flex-direction: row-reverse;
      max-width: min(760px, 78%);
    }

    &--loading {
      align-self: flex-start;
    }
  }

  &__avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
  }

  &__avatar--ai {
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    color: #fff;
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__message--user &__avatar {
    background: var(--el-color-primary);
    color: #fff;
  }

  &__bubble {
    padding: 14px 18px;
    border-radius: 18px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    line-height: 1.7;
    font-size: 14px;
    position: relative;
  }

  &__message--user &__bubble {
    background: var(--el-color-primary);
    color: #fff;
    border-bottom-right-radius: 6px;
  }

  &__bubble:not(.ai-chat__bubble--loading) {
    border-bottom-left-radius: 6px;
  }

  &__content {
    margin: 0;
    white-space: pre-wrap;
  }

  &__time {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    opacity: 0.6;
  }

  &__bubble--loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  &__thinking-icon {
    animation: thinkingPulse 1.6s ease-in-out infinite;
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

  &__quick {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px 24px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-fill-color-light);
  }

  &__quick-btn {
    padding: 8px 14px;
    border-radius: 100px;
    border: 1px solid var(--el-border-color);
    background: var(--el-bg-color);
    color: var(--el-text-color-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background: rgba(64, 128, 255, 0.06);
    }
  }

  &__input-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 12px 18px;
    border-radius: 12px;
    border: 1px solid var(--el-border-color);
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    font-size: 14px;
    outline: none;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &::placeholder {
      color: var(--el-text-color-placeholder);
    }

    &:focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb, 100 132 236), 0.12);
    }
  }

  &__send {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: var(--el-color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: var(--el-color-primary-light-3);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 768px) {
  .ai-chat {
    &__header {
      padding: 20px;
    }

    &__card {
      min-height: 420px;
    }

    &__message {
      max-width: 100%;
    }

    &__input-bar {
      padding: 12px 16px;
    }

    &__quick {
      padding: 12px 16px;
    }
  }
}
</style>
