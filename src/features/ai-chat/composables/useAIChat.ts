import type { ChatMessage, Conversation, MessageFeedback, RichContent } from '../types'
/**
 * useAIChat - AI 助手对话核心 composable
 *
 * 向后兼容设计：
 * - 实例级 messages/loading，每个 useAIChat() 调用方拥有独立消息列表
 *   （AIChatDrawer 与 AIChat 独立页互不干扰）
 * - 旧 API 签名不变：sendMessage(text) / clearMessages() / formatTime
 *   AIChatDrawer 解构 { messages, loading, sendMessage } 零改动
 *
 * 新增能力（仅 AIChat 独立页使用）：
 * - 模块级 conversations / currentConversationId：多对话保存/切换
 * - createConversation / switchConversation / deleteConversation
 * - setFeedback：消息有用/无用反馈
 * - simulateAIReply 返回 { plain, rich }，rich 为结构化富文本
 *
 * 职业规划话题联动：
 * - 命中"职业规划/短板"关键词时，读取 archiveStore + careerPlanStore 真实数据
 * - 调 analyzeCareer 生成个性化短板分析 → 写入 careerPlanStore.aiAnalysis
 * - CareerPlan.vue 读 store.aiAnalysis 响应式渲染短板区域（AI 回复回流页面）
 */
import { ref } from 'vue'
import {
  deleteConversation as apiDeleteConversation,
  sendMessage as apiSendMessage,
  submitFeedback as apiSubmitFeedback,
} from '@/shared/api/ai-chat'

// 重新导出类型，保持旧的 `import type { ChatMessage } from './useAIChat'` 可用
export type { ChatMessage, Conversation, MessageFeedback, RichContent }

/** 欢迎消息工厂（每次返回新对象，避免引用共享） */
function createWelcomeMessages(): ChatMessage[] {
  return [
    {
      id: 'welcome',
      role: 'ai',
      content:
        '你好！我是你的档案智能助手，可以帮你解答关于个人档案、奖项申报、成长记录等方面的问题。',
      time: formatTime(new Date()),
    },
  ]
}

/** 格式化时间 HH:mm */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ── 模块级状态：多对话管理（所有 useAIChat 实例共享，AIChatDrawer 不触碰）──
const conversations = ref<Conversation[]>([])
const currentConversationId = ref<string | null>(null)
let conversationIdCounter = 0

/** 深拷贝消息列表（避免双向污染） */
function cloneMessages(list: ChatMessage[]): ChatMessage[] {
  return list.map((m) => ({
    ...m,
    richContent: m.richContent
      ? { ...m.richContent, blocks: [...m.richContent.blocks] }
      : undefined,
  }))
}

/** 取首条用户消息前 14 字作为对话标题 */
function getConversationTitle(list: ChatMessage[]): string {
  const firstUser = list.find((m) => m.role === 'user')
  if (!firstUser) return '新对话'
  const text = firstUser.content.trim().slice(0, 14)
  return text + (firstUser.content.trim().length > 14 ? '...' : '')
}

export function useAIChat() {
  // ── 实例级状态（保持现状，AIChatDrawer 无感知）──
  const messages = ref<ChatMessage[]>(createWelcomeMessages())
  const loading = ref(false)

  /**
   * 发送消息（通过 API 层获取 AI 回复，后端就绪后改 API 层即可）
   * - AIChatDrawer 调用 sendMessage(text) → 默认走 API
   * - AIChat 独立页可传 { delay } 控制思考动画时长（仅 UI 效果，与 API 响应无关）
   */
  async function sendMessage(text: string, _options?: { delay?: number }) {
    const trimmed = text.trim()
    if (!trimmed || loading.value) return

    // 用户消息
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      time: formatTime(new Date()),
    }
    messages.value.push(userMsg)

    loading.value = true
    try {
      const result = await apiSendMessage(trimmed, currentConversationId.value ?? undefined)
      messages.value.push({
        id: result.message.id,
        role: 'ai',
        content: result.message.content,
        time: result.message.time,
        richContent: result.message.richContent,
      })
      // 新对话时记录 conversationId（供后续消息和 conversation 管理使用）
      if (!currentConversationId.value) {
        currentConversationId.value = result.conversationId
      }
    } catch {
      messages.value.push({
        id: `ai-error-${Date.now()}`,
        role: 'ai',
        content: '抱歉，AI 助手暂时无法响应，请稍后重试。',
        time: formatTime(new Date()),
      })
    } finally {
      loading.value = false
    }
  }

  /** 清空消息（恢复欢迎语）— 旧 API 不变 */
  function clearMessages() {
    messages.value = createWelcomeMessages()
    loading.value = false
  }

  // ── 新增：多对话管理（仅 AIChat 独立页调用）──

  /** 新建对话：当前有内容时保存到历史，重置欢迎语，返回新对话 id（未保存则 null） */
  async function createConversation(): Promise<string | null> {
    if (messages.value.length <= 1) {
      currentConversationId.value = null
      return null
    }
    const conv: Conversation = {
      id: currentConversationId.value ?? `conv_${++conversationIdCounter}`,
      title: getConversationTitle(messages.value),
      messages: cloneMessages(messages.value),
      createTime: new Date().toLocaleString('zh-CN'),
    }
    conversations.value.unshift(conv)
    currentConversationId.value = null
    messages.value = createWelcomeMessages()
    return conv.id
  }

  /** 切换到指定历史对话 */
  function switchConversation(id: string) {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return
    currentConversationId.value = id
    messages.value = cloneMessages(conv.messages)
    loading.value = false
  }

  /** 删除指定历史对话 */
  async function deleteConversation(id: string) {
    const idx = conversations.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    try {
      await apiDeleteConversation(id)
    } catch {
      // API 失败不影响本地删除
    }
    conversations.value.splice(idx, 1)
    if (currentConversationId.value === id) {
      currentConversationId.value = null
      messages.value = createWelcomeMessages()
    }
  }

  /** 设置消息反馈 */
  async function setFeedback(msgId: string, feedback: MessageFeedback) {
    const msg = messages.value.find((m) => m.id === msgId)
    if (!msg) return
    // 再次点击同一反馈则取消
    const newFeedback = msg.feedback === feedback ? null : feedback
    msg.feedback = newFeedback
    if (newFeedback) {
      apiSubmitFeedback(msgId, newFeedback, currentConversationId.value ?? undefined).catch(
        () => {},
      )
    }
  }

  return {
    // 旧 API（不变）
    messages,
    loading,
    sendMessage,
    clearMessages,
    formatTime,
    // 新增 API
    conversations,
    currentConversationId,
    createConversation,
    switchConversation,
    deleteConversation,
    setFeedback,
  }
}
