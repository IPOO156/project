import type {
  AIConversationMessage,
  AIRegenerateResult,
  AISendMessageResult,
  ChatMessage,
  Conversation,
  MessageFeedback,
  RichContent,
} from '../types'
/**
 * useAIChat - AI 助手对话核心 composable
 *
 * 前端优先接入后端真实接口（见《学生端接口文档》九、AI 对话模块）：
 *   - 会话列表/切换/删除 → getAIConversations / getAIConversationMessages / deleteAIConversation
 *   - 发送消息 → sendAIMessage（会话不存在时先 createAIConversation）
 *   - 重新生成 → regenerateAIMessage
 *
 * 后端不可用（网络错误 / 超时 / 接口未实现 404 / 网关 5xx 非业务响应）时，
 * 回退本地模拟回复与知识库逻辑并在消息上标注“离线模式”，保证纯前端也能演示。
 *
 * 向后兼容设计：
 * - 实例级 messages/loading，每个 useAIChat() 调用方拥有独立消息列表
 *   （AIChatDrawer 与 AIChat 独立页互不干扰）
 * - 旧 API 签名不变：sendMessage(text) / clearMessages() / formatTime
 *   AIChatDrawer 解构 { messages, loading, sendMessage } 零改动
 */
import { ref } from 'vue'
// 真实接口 + 本地模拟回复（离线回退）与反馈占位实现
import {
  sendMessage as apiSendMessageOffline,
  submitFeedback as apiSubmitFeedback,
  createAIConversation,
  deleteAIConversation,
  getAIConversationMessages,
  getAIConversations,
  regenerateAIMessage,
  sendAIMessage,
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

/**
 * 判断错误是否属于“后端不可用”（应回退离线模式）：
 *   - 请求超时（ECONNABORTED）
 *   - 无 HTTP 响应（axios 网络层错误，如 ERR_NETWORK）
 *   - 404（接口未实现/路径不存在）
 *   - 5xx 且响应体非业务 JSON（如开发环境后端未启动，vite proxy 返回失败态）
 * 其余错误（拦截器转出的业务错误 code!=0、参数校验失败等）视为真实错误，走既有错误重试 UI。
 */
function isBackendUnavailable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; response?: { status?: number; data?: unknown } }
  if (e.code === 'ECONNABORTED') return true
  if (!e.response) {
    // 拦截器把业务错误转成无 code 的普通 Error；带 code 的则多为 axios 网络层错误
    return typeof e.code === 'string' && e.code.length > 0
  }
  const status = e.response.status ?? 0
  if (status === 404) return true
  if (status >= 500) {
    const data = e.response.data
    return !(data && typeof data === 'object' && 'code' in data)
  }
  return false
}

// ── 模块级状态：多对话管理（所有 useAIChat 实例共享，AIChatDrawer 不触碰会话列表）──
const conversations = ref<Conversation[]>([])
const currentConversationId = ref<number | null>(null)

export function useAIChat() {
  // ── 实例级状态（保持现状，AIChatDrawer 无感知）──
  const messages = ref<ChatMessage[]>(createWelcomeMessages())
  const loading = ref(false)
  /** 最近一次 AI 请求是否失败（用于展示“重新生成”重试入口） */
  const error = ref(false)
  /** 最近一次提问文本（重试时重新生成对应回复，不重复追加用户气泡） */
  let lastUserText = ''
  /** 最近一条可重新生成的助手消息（在线模式下后端的 messageId） */
  let lastAssistantMessageId: number | null = null

  /** 追加用户消息气泡 */
  function pushUserMessage(text: string) {
    messages.value.push({
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      time: formatTime(new Date()),
    })
  }

  /** 追加 AI 失败提示气泡，并标记错误状态 */
  function pushErrorMessage() {
    error.value = true
    messages.value.push({
      id: `ai-error-${Date.now()}`,
      role: 'ai',
      content: '抱歉，AI 助手暂时无法响应，请稍后重试。',
      time: formatTime(new Date()),
    })
  }

  /** 离线回退：调用本地模拟回复，并标记“离线模式” */
  async function requestOfflineReply(text: string): Promise<ChatMessage> {
    const result = await apiSendMessageOffline(text)
    return {
      id: result.message.id,
      role: 'ai',
      content: result.message.content,
      time: result.message.time,
      richContent: result.message.richContent,
      offline: true,
    }
  }

  /** 在线发送：确保会话存在后调用 sendAIMessage，返回助手消息 */
  async function requestOnlineReply(text: string): Promise<ChatMessage> {
    let cid = currentConversationId.value
    if (cid == null) {
      const conv = await createAIConversation()
      cid = conv.conversationId
      currentConversationId.value = cid
      void loadConversations()
    }
    const res: AISendMessageResult = await sendAIMessage(cid, text)
    lastAssistantMessageId = res.messageId
    return {
      id: String(res.messageId),
      role: 'ai',
      content: res.content,
      time: formatTime(new Date()),
    }
  }

  /** 请求 AI 回复并写入消息列表；成功/离线回退清除错误状态，真实业务错误展示错误气泡 */
  async function requestAIReply(text: string) {
    loading.value = true
    try {
      messages.value.push(await requestOnlineReply(text))
      error.value = false
    } catch (err) {
      if (isBackendUnavailable(err)) {
        messages.value.push(await requestOfflineReply(text))
        lastAssistantMessageId = null
        error.value = false
      } else {
        pushErrorMessage()
      }
    } finally {
      loading.value = false
    }
  }

  /** 重新生成：调用后端 regenerateAIMessage，失败时按同样策略回退 */
  async function requestRegenerate(cid: number, messageId: number) {
    loading.value = true
    try {
      const res: AIRegenerateResult = await regenerateAIMessage(cid, messageId)
      lastAssistantMessageId = res.messageId
      messages.value.push({
        id: String(res.messageId),
        role: 'ai',
        content: res.content,
        time: formatTime(new Date()),
      })
      error.value = false
    } catch (err) {
      if (isBackendUnavailable(err)) {
        messages.value.push(await requestOfflineReply(lastUserText))
        lastAssistantMessageId = null
        error.value = false
      } else {
        pushErrorMessage()
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 发送消息（真实接口优先，后端不可用时回退本地模拟回复）
   * - AIChatDrawer 调用 sendMessage(text) → 默认走 API
   * - AIChat 独立页可传 { delay } 控制思考动画时长（仅 UI 效果，与 API 响应无关）
   */
  async function sendMessage(text: string, _options?: { delay?: number }) {
    const trimmed = text.trim()
    if (!trimmed || loading.value) return

    lastUserText = trimmed
    pushUserMessage(trimmed)
    await requestAIReply(trimmed)
  }

  /** 重新生成最近一次 AI 回复（在线有真实消息 ID 时走 regenerateAIMessage） */
  async function retry() {
    if (loading.value || !lastUserText) return
    const last = messages.value[messages.value.length - 1]
    if (last && last.role === 'ai' && last.id.startsWith('ai-error-')) {
      messages.value.pop()
    }
    error.value = false
    const cid = currentConversationId.value
    const messageId = lastAssistantMessageId
    if (cid != null && messageId != null) {
      await requestRegenerate(cid, messageId)
    } else {
      await requestAIReply(lastUserText)
    }
  }

  /** 清空消息（恢复欢迎语）— 旧 API 不变 */
  function clearMessages() {
    messages.value = createWelcomeMessages()
    loading.value = false
    error.value = false
    lastAssistantMessageId = null
  }

  // ── 会话管理（真实接口）──

  /** 加载会话列表（GET /ai/conversations）；后端不可用时保持空列表（离线无历史） */
  async function loadConversations() {
    try {
      const res = await getAIConversations({ page: 1, per_page: 50 })
      conversations.value = res.list ?? []
    } catch {
      conversations.value = []
    }
  }

  /** 新建对话：重置为欢迎语；会话由后端在首条消息发送时按需创建 */
  function createConversation(): null {
    currentConversationId.value = null
    lastAssistantMessageId = null
    messages.value = createWelcomeMessages()
    error.value = false
    return null
  }

  /** 切换到指定历史对话（GET /ai/conversations/{id}/messages） */
  async function switchConversation(id: number) {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return
    currentConversationId.value = id
    lastAssistantMessageId = null
    loading.value = false
    error.value = false
    try {
      const detail = await getAIConversationMessages(id)
      const list: AIConversationMessage[] = detail.messages
      const lastAssistant = [...list].reverse().find((m) => m.role === 'assistant')
      lastAssistantMessageId = lastAssistant ? lastAssistant.id : null
      messages.value = list.map((m) => ({
        id: String(m.id),
        role: m.role === 'assistant' ? ('ai' as const) : ('user' as const),
        content: m.content,
        time: formatTime(new Date(m.createdAt)),
        // 回显已提交反馈（后端 MessageItem 补 feedback 字段后生效；未返回/未反馈为 null）
        feedback: m.feedback ?? null,
      }))
    } catch {
      messages.value = createWelcomeMessages()
    }
  }

  /** 删除指定历史对话（DELETE /ai/conversations/{id}） */
  async function deleteConversation(id: number) {
    const idx = conversations.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    try {
      await deleteAIConversation(id)
    } catch {
      // API 失败不影响本地删除
    }
    conversations.value.splice(idx, 1)
    if (currentConversationId.value === id) {
      currentConversationId.value = null
      lastAssistantMessageId = null
      messages.value = createWelcomeMessages()
    }
  }

  /** 设置消息反馈（真实消息走 POST /ai/messages/{messageId}/feedback 持久化；离线/本地消息仅本地切换） */
  async function setFeedback(msgId: string, feedback: MessageFeedback) {
    const msg = messages.value.find((m) => m.id === msgId)
    if (!msg) return
    // 再次点击同一反馈则取消
    const newFeedback = msg.feedback === feedback ? null : feedback
    msg.feedback = newFeedback
    // 仅对后端真实消息（数字 messageId）上报反馈；离线模拟/欢迎语/错误气泡等本地消息
    // 无后端消息 ID，上报会返回「消息不存在」，只做本地切换
    if (newFeedback && /^\d+$/.test(msgId)) {
      apiSubmitFeedback(Number(msgId), newFeedback).catch(() => {})
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
    error,
    retry,
    conversations,
    currentConversationId,
    loadConversations,
    createConversation,
    switchConversation,
    deleteConversation,
    setFeedback,
  }
}
