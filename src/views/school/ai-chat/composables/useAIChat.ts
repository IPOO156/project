import type {
  AIConversationMessage,
  AIRegenerateResult,
  AISendMessageResult,
  ChatMessage,
  Conversation,
  MessageFeedback,
  RichContent,
} from '../ai-chat.types'
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
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
// 真实接口 + 本地模拟回复（离线回退）与反馈占位实现
import {
  AIStreamPreflightError,
  submitFeedback as apiSubmitFeedback,
  createAIConversation,
  deleteAIConversation,
  getAIConversationMessages,
  getAIConversations,
  regenerateAIMessage,
  renameAIConversation,
  sendAIMessage,
  sendAIMessageStream,
} from '@/shared/api/ai-chat'
import { sendMessage as apiSendMessageOffline } from '../services/offlineChat'
import { parseMarkdownToRichContent } from '../utils/richText'

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
  /** 当前是否正在流式生成（用于发送/停止按钮切换） */
  const isStreaming = ref(false)
  /** 当前流式请求的中断控制器（停止生成 / 切换会话 / 清空时中断） */
  let abortController: AbortController | null = null
  /** 最近一次 AI 请求是否失败（用于展示“重新生成”重试入口） */
  const error = ref(false)
  /**
   * 当前是否处于离线回退状态：后端不可用、回复由本地模拟产生时为 true。
   * 用于顶栏展示真实连接状态，避免离线时仍显示“在线”。
   */
  const offlineMode = ref(false)
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
    offlineMode.value = true
    return {
      id: result.message.id,
      role: 'ai',
      content: result.message.content,
      time: result.message.time,
      richContent: result.message.richContent,
      offline: true,
    }
  }

  /** 确保当前会话存在：未绑定时先创建（流式/同步/重新生成共用） */
  async function ensureConversation(): Promise<number> {
    let cid = currentConversationId.value
    if (cid == null) {
      const conv = await createAIConversation()
      cid = conv.conversationId
      currentConversationId.value = cid
      void loadConversations()
    }
    return cid
  }

  /** 在线发送（同步接口，作为旧后端/流式不可用时的降级路径）：返回助手消息 */
  async function requestOnlineReply(text: string): Promise<ChatMessage> {
    const cid = await ensureConversation()
    const res: AISendMessageResult = await sendAIMessage(cid, text)
    offlineMode.value = false
    lastAssistantMessageId = res.messageId
    // 后端返回结构化富文本时优先按块渲染；未返回或 blocks 为空再退回本地 markdown 解析
    const richContent = res.richContent?.blocks?.length
      ? res.richContent
      : parseMarkdownToRichContent(res.content)
    return {
      id: String(res.messageId),
      role: 'ai',
      content: res.content,
      richContent,
      time: formatTime(new Date()),
    }
  }

  /** 中断当前流式请求（切换会话 / 清空 / 新建对话时调用） */
  function abortActiveStream() {
    abortController?.abort()
    abortController = null
    isStreaming.value = false
  }

  /** 标记用户主动停止：保留已收到的片段，未收到任何内容则移除空气泡 */
  function markStopped(msg: ChatMessage) {
    msg.streaming = false
    msg.stopped = true
    if (!msg.content) {
      const idx = messages.value.indexOf(msg)
      if (idx !== -1) messages.value.splice(idx, 1)
    }
  }

  /** 旧后端尚未实现流式接口（404/405/415） */
  function isStreamEndpointMissing(err: unknown): boolean {
    return (
      err instanceof AIStreamPreflightError &&
      (err.status === 404 || err.status === 405 || err.status === 415)
    )
  }

  /**
   * 流式请求彻底失败时的降级：
   * - 旧后端没有 /messages/stream → 退回同步接口，与改造前体验一致
   * - 后端不可用（网络/超时/5xx）→ 退回离线模拟回复
   * - 其余真实业务错误 → 错误气泡 + 重新生成入口
   */
  async function fallbackReply(text: string, streamError: unknown) {
    let err = streamError
    if (isStreamEndpointMissing(err)) {
      try {
        messages.value.push(await requestOnlineReply(text))
        error.value = false
        return
      } catch (syncErr) {
        err = syncErr
      }
    }
    if (isBackendUnavailable(err)) {
      messages.value.push(await requestOfflineReply(text))
      lastAssistantMessageId = null
      error.value = false
    } else {
      ElMessage.error(err instanceof Error ? err.message : '网络错误')
      pushErrorMessage()
    }
  }

  /**
   * 流式请求 AI 回复（9.4.1）：
   * 先插入助手占位气泡，delta 逐段追加；done 回填真实 messageId 供反馈/重新生成；
   * 用户停止或流未建立时按 markStopped / fallbackReply 收尾。
   */
  async function requestStreamingReply(text: string) {
    const placeholder: ChatMessage = {
      id: `ai-stream-${Date.now()}`,
      role: 'ai',
      content: '',
      time: formatTime(new Date()),
      streaming: true,
    }
    messages.value.push(placeholder)
    // 必须从数组中读回响应式代理再改字段：直接改 push 进去的原始对象不会触发重渲染，
    // 流式增量会全部看不到。
    const streamMsg = messages.value[messages.value.length - 1]
    const controller = new AbortController()
    abortController = controller
    isStreaming.value = true

    try {
      const cid = await ensureConversation()
      await sendAIMessageStream(
        cid,
        text,
        {
          onDelta(chunk) {
            streamMsg.content += chunk
          },
          onDone(payload) {
            streamMsg.id = String(payload.messageId)
            streamMsg.streaming = false
            streamMsg.richContent = parseMarkdownToRichContent(streamMsg.content)
            streamMsg.time = formatTime(
              payload.createdAt ? new Date(payload.createdAt) : new Date(),
            )
            lastAssistantMessageId = payload.messageId
            offlineMode.value = false
            // 首条消息后后端会生成会话标题，刷新左侧列表（标题/最后时间/排序）
            void loadConversations()
          },
          onError(message) {
            streamMsg.streaming = false
            streamMsg.failed = true
            if (!streamMsg.content) {
              streamMsg.content = '抱歉，AI 助手暂时无法响应，请稍后重试。'
            }
            error.value = true
            ElMessage.error(message)
          },
        },
        controller.signal,
      )
      if (controller.signal.aborted) markStopped(streamMsg)
    } catch (err) {
      if (controller.signal.aborted) {
        markStopped(streamMsg)
        return
      }
      // 流未建立成功：移除占位，按旧策略降级
      const idx = messages.value.indexOf(streamMsg)
      if (idx !== -1) messages.value.splice(idx, 1)
      await fallbackReply(text, err)
    } finally {
      // 仅当前流仍是活跃流时复位，避免中断后新请求被旧请求的 finally 清掉
      if (abortController === controller) {
        abortController = null
        isStreaming.value = false
        loading.value = false
      }
      streamMsg.streaming = false
    }
  }

  /** 请求 AI 回复并写入消息列表；成功/离线回退清除错误状态，真实业务错误展示错误气泡 */
  async function requestAIReply(text: string) {
    loading.value = true
    error.value = false
    try {
      await requestStreamingReply(text)
    } finally {
      // 活跃流已在 requestStreamingReply 内复位；中断场景由调用方复位 loading
      if (isStreaming.value === false && abortController === null) loading.value = false
    }
  }

  /** 停止当前流式生成（仅中断本地连接；后端不会落库这条助手消息） */
  function stopGeneration() {
    abortController?.abort()
  }

  /** 重新生成：调用后端 regenerateAIMessage，失败时按同样策略回退 */
  async function requestRegenerate(cid: number, messageId: number) {
    loading.value = true
    try {
      const res: AIRegenerateResult = await regenerateAIMessage(cid, messageId)
      offlineMode.value = false
      lastAssistantMessageId = res.messageId
      const richContent = res.richContent?.blocks?.length
        ? res.richContent
        : parseMarkdownToRichContent(res.content)
      messages.value.push({
        id: String(res.messageId),
        role: 'ai',
        content: res.content,
        richContent,
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
    if (last && last.role === 'ai' && (last.id.startsWith('ai-error-') || last.failed)) {
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

  /**
   * 清空消息（恢复欢迎语）— 旧 API 不变
   *
   * 同时解除当前会话绑定：清空后再发消息会新建后端会话，
   * 避免下一条消息继续追加到旧会话、切回历史时旧消息“复活”。
   * 旧会话本身仍保留在历史列表中，可手动删除。
   */
  function clearMessages() {
    abortActiveStream()
    messages.value = createWelcomeMessages()
    loading.value = false
    error.value = false
    lastAssistantMessageId = null
    lastUserText = ''
    currentConversationId.value = null
  }

  // ── 会话管理（真实接口）──

  /** 加载会话列表（GET /ai/conversations）；后端不可用时保持空列表（离线无历史） */
  async function loadConversations() {
    try {
      const res = await getAIConversations({ page: 1, per_page: 50 })
      conversations.value = res.list ?? []
    } catch {
      conversations.value = []
      offlineMode.value = true
    }
  }

  /** 新建对话：重置为欢迎语；会话由后端在首条消息发送时按需创建 */
  function createConversation(): null {
    abortActiveStream()
    currentConversationId.value = null
    lastAssistantMessageId = null
    messages.value = createWelcomeMessages()
    error.value = false
    loading.value = false
    return null
  }

  /** 切换到指定历史对话（GET /ai/conversations/{id}/messages） */
  async function switchConversation(id: number) {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return
    abortActiveStream()
    currentConversationId.value = id
    lastAssistantMessageId = null
    loading.value = false
    error.value = false
    try {
      const detail = await getAIConversationMessages(id)
      const list: AIConversationMessage[] = detail.messages
      const lastAssistant = [...list].reverse().find((m) => m.role === 'assistant')
      lastAssistantMessageId = lastAssistant ? lastAssistant.id : null
      messages.value = list.map((m) => {
        const isAi = m.role === 'assistant'
        const richContent = isAi
          ? m.richContent?.blocks?.length
            ? m.richContent
            : parseMarkdownToRichContent(m.content)
          : undefined
        return {
          id: String(m.id),
          role: isAi ? ('ai' as const) : ('user' as const),
          content: m.content,
          richContent,
          time: formatTime(new Date(m.createdAt)),
          // 回显已提交反馈（后端 MessageItem 补 feedback 字段后生效；未返回/未反馈为 null）
          feedback: m.feedback ?? null,
        }
      })
    } catch {
      messages.value = createWelcomeMessages()
    }
  }

  /** 删除指定历史对话（DELETE /ai/conversations/{id}），返回是否真的删除成功 */
  async function deleteConversation(id: number): Promise<boolean> {
    const idx = conversations.value.findIndex((c) => c.id === id)
    if (idx === -1) return true
    try {
      await deleteAIConversation(id)
    } catch {
      // 服务端删除失败时保留本地会话，由调用方提示，避免伪删除
      return false
    }
    conversations.value.splice(idx, 1)
    if (currentConversationId.value === id) {
      abortActiveStream()
      currentConversationId.value = null
      lastAssistantMessageId = null
      messages.value = createWelcomeMessages()
    }
    return true
  }

  /**
   * 重命名历史对话（PUT /ai/conversations/{id}）
   * 乐观更新本地标题；后端失败不回滚（接口未实现时静默降级）。
   */
  async function renameConversation(id: number, title: string) {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return
    const trimmed = title.trim()
    if (!trimmed) return
    const oldTitle = conv.title
    conv.title = trimmed
    try {
      await renameAIConversation(id, trimmed)
    } catch {
      // 后端未实现重命名接口时回滚本地标题，避免与服务端不一致
      conv.title = oldTitle
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
    // 流式
    isStreaming,
    stopGeneration,
    // 新增 API
    error,
    offlineMode,
    retry,
    conversations,
    currentConversationId,
    loadConversations,
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    setFeedback,
  }
}
