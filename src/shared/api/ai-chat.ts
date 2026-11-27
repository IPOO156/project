/**
 * AI 助手 HTTP 接口（与《学生端接口文档》九、AI 对话模块一致）。
 *
 * 本文件只负责请求与响应类型，不包含任何业务编排：
 * 离线回退应答（依赖档案/职业规划 store 与知识库）在
 * `features/ai-chat/services/offlineChat.ts`，避免 shared 反向依赖上层。
 *
 * 真实后端接口：/ai/conversations、/ai/conversations/{id}/messages、
 * /ai/conversations/{id}/messages/stream（SSE 流式，接口文档 9.4.1）、
 * /ai/conversations/{id}/messages/{mid}/regenerate、/ai/suggestions、/ai/messages/{mid}/feedback、
 * DELETE /ai/conversations/{id}。
 */
import type { RequestConfig } from './request'
import type {
  AISuggestedAction,
  AISuggestion,
  RichContent,
} from '@/views/school/ai-chat/ai-chat.types'
import { getToken } from '@/shared/utils/token'
import request, { API_BASE_URL, forceLogout, tryRefreshToken } from './request'

export interface ConversationSummary {
  id: string
  title: string
  createTime: string
  messageCount: number
}

// ── API 函数 ──

/**
 * 提交消息反馈（9.8 POST /ai/messages/{messageId}/feedback，幂等：同消息重复反馈覆盖）
 * messageId 须为后端真实消息 ID（数字）；离线模拟/欢迎语等本地消息无后端 ID，调用方不应上报。
 */
export function submitFeedback(
  messageId: number | string,
  feedback: 'useful' | 'useless',
): Promise<{ messageId: number; feedback: string }> {
  return request.post(`/ai/messages/${messageId}/feedback`, { feedback })
}

/** 创建对话会话（POST /ai/conversations） */
export function createAIConversation(payload?: {
  title?: string
  context?: Record<string, unknown>
}): Promise<{
  conversationId: number
  title: string
  status: number
  createdAt: string
}> {
  return request.post('/ai/conversations', payload ?? {})
}

/** 获取对话会话列表（GET /ai/conversations） */
export function getAIConversations(params?: { page?: number; per_page?: number }): Promise<{
  total: number
  list: Array<{
    id: number
    title: string
    status: number
    statusLabel: string
    lastMessageTime?: string
    createdAt: string
  }>
  pagination: { page: number; per_page: number; total: number; total_pages: number }
}> {
  return request.get('/ai/conversations', { params })
}

/** 获取对话消息列表（GET /ai/conversations/{conversationId}/messages） */
export function getAIConversationMessages(conversationId: number): Promise<{
  conversationId: number
  title: string
  messages: Array<{
    id: number
    role: 'user' | 'assistant'
    content: string
    modelName?: string
    tokenUsage?: number
    generationTimeMs?: number
    createdAt: string
    /** 后端结构化富文本（11.2 契约）；存在时前端优先按块渲染 */
    richContent?: RichContent
    /** 当前用户对该消息的反馈（待后端 MessageItem 补字段后返回；未返回/未反馈为 null） */
    feedback?: 'useful' | 'useless' | null
  }>
}> {
  return request.get(`/ai/conversations/${conversationId}/messages`)
}

/** 发送消息（POST /ai/conversations/{conversationId}/messages） */
export function sendAIMessage(
  conversationId: number,
  content: string,
): Promise<{
  messageId: number
  role: 'assistant'
  content: string
  modelName?: string
  tokenUsage?: number
  generationTimeMs?: number
  createdAt: string
  /** 后端结构化富文本（11.2 契约）；存在时前端优先按块渲染 */
  richContent?: RichContent
  suggestedActions?: Array<{ label: string; jumpUrl: string; actionType: string }>
}> {
  // 同步等待大模型生成：后端 DeepSeek 超时 60s（DeepSeekProperties.timeoutMs），
  // 全局 15s 会先中断并提示「请求超时」，因此单次调用放宽到 65s。
  return request.post(
    `/ai/conversations/${conversationId}/messages`,
    { content },
    { timeout: 65_000 },
  )
}

// ── 流式发送（9.4.1 SSE）──

/** 流式结束事件载荷（done），字段含义同 9.4 同步响应 */
export interface AIStreamDonePayload {
  messageId: number
  role: 'assistant'
  modelName?: string
  tokenUsage?: number
  generationTimeMs?: number
  createdAt?: string
  suggestedActions?: AISuggestedAction[]
}

export interface AIStreamHandlers {
  /** 增量文本，调用方追加到当前助手消息 */
  onDelta: (content: string) => void
  /** 生成完成：携带后端真实 messageId（反馈/重新生成的入参） */
  onDone: (payload: AIStreamDonePayload) => void
  /** 流内 error 事件或连接中断（业务提示，调用方负责展示） */
  onError: (message: string) => void
}

/**
 * 流式接口在建立 SSE 之前就失败（HTTP 非 2xx / 非 text/event-stream）。
 * 调用方据 status 判断是否属于「旧后端未实现流式接口」并回退同步接口。
 */
export class AIStreamPreflightError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AIStreamPreflightError'
    this.status = status
  }
}

/**
 * 发送消息（SSE 流式，接口文档 9.4.1）。
 *
 * 必须用 fetch + getReader：EventSource 只支持 GET 且无法携带 Authorization。
 * `done.messageId` 在流结束前不可知，由 onDone 回填给调用方。
 * 用户主动中断时抛出 AbortError（调用方按 signal.aborted 处理，不提示失败）。
 */
export async function sendAIMessageStream(
  conversationId: number,
  content: string,
  handlers: AIStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const url = `${API_BASE_URL}/ai/conversations/${conversationId}/messages/stream`

  const postStream = (token: string) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
      signal,
    })

  let res = await postStream(getToken())
  // fetch 不经过 axios 拦截器：401 时复用同一套刷新逻辑重试一次，失败则登出
  if (res.status === 401) {
    const newToken = await tryRefreshToken()
    if (!newToken) {
      forceLogout()
      throw new AIStreamPreflightError('登录已过期，请重新登录', 401)
    }
    res = await postStream(newToken)
  }

  // 前置校验错误（会话不存在/非本人/已禁用/内容为空等）仍返回 ApiResult JSON
  const contentType = res.headers.get('content-type') ?? ''
  if (!res.ok || !contentType.includes('text/event-stream')) {
    throw new AIStreamPreflightError(await readStreamErrorMessage(res), res.status)
  }

  const reader = res.body?.getReader()
  if (!reader) {
    handlers.onError('当前浏览器不支持流式响应，请更换浏览器后重试')
    return
  }

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let doneReceived = false
  let failed = false

  const handleLine = (raw: string) => {
    const line = raw.replace(/\r$/, '')
    if (!line.startsWith('data:')) return
    const event = parseStreamEvent(line.slice(5).trim())
    if (!event) return
    if (event.type === 'delta') {
      handlers.onDelta(event.content)
    } else if (event.type === 'done') {
      doneReceived = true
      handlers.onDone(event.payload)
    } else if (event.type === 'error') {
      failed = true
      handlers.onError(event.message)
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // 末尾可能是不完整行，留到下一轮拼接，不能直接整段解析
      buffer = lines.pop() ?? ''
      for (const line of lines) handleLine(line)
    }
    buffer += decoder.decode()
    for (const line of buffer.split('\n')) handleLine(line)
  } catch (err) {
    // 用户主动中断：交由调用方按 signal.aborted 标记「已停止」
    if (signal?.aborted || isAbortError(err)) throw err
    if (!failed) handlers.onError('回复中断，请稍后重试')
    return
  }

  // 连接正常关闭但没收到 done：后端落库失败或代理提前断开
  if (!doneReceived && !failed && !signal?.aborted) {
    handlers.onError('回复中断，请稍后重试')
  }
}

type ParsedStreamEvent =
  | { type: 'start' }
  | { type: 'delta'; content: string }
  | { type: 'done'; payload: AIStreamDonePayload }
  | { type: 'error'; message: string }

/** 解析单行 data JSON；字段不合法时返回 null（忽略该事件，不中断流） */
function parseStreamEvent(raw: string): ParsedStreamEvent | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const record = parsed as Record<string, unknown>

  switch (record.type) {
    case 'start':
      return { type: 'start' }
    case 'delta':
      return typeof record.content === 'string' ? { type: 'delta', content: record.content } : null
    case 'error':
      return {
        type: 'error',
        message:
          typeof record.message === 'string' ? record.message : 'AI 服务暂时不可用，请稍后重试。',
      }
    case 'done':
      return typeof record.messageId === 'number'
        ? { type: 'done', payload: toDonePayload(record) }
        : null
    default:
      return null
  }
}

function toDonePayload(record: Record<string, unknown>): AIStreamDonePayload {
  return {
    messageId: record.messageId as number,
    role: 'assistant',
    modelName: typeof record.modelName === 'string' ? record.modelName : undefined,
    tokenUsage: typeof record.tokenUsage === 'number' ? record.tokenUsage : undefined,
    generationTimeMs:
      typeof record.generationTimeMs === 'number' ? record.generationTimeMs : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
    suggestedActions: Array.isArray(record.suggestedActions)
      ? (record.suggestedActions as AISuggestedAction[])
      : undefined,
  }
}

function isAbortError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError'
}

/** 读取前置错误响应体：优先展示后端 message，避免向用户暴露状态码等技术细节 */
async function readStreamErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
  } catch {
    // 非 JSON 响应（如代理错误页），走下方兜底文案
  }
  if (res.status === 429) return '请求过于频繁，请稍后重试'
  if (res.status >= 500) return '服务器异常，请稍后重试'
  return '请求失败，请稍后重试'
}

/** 重新生成 AI 消息（POST /ai/conversations/{conversationId}/messages/{messageId}/regenerate） */
export function regenerateAIMessage(
  conversationId: number,
  messageId: number,
): Promise<{
  messageId: number
  role: 'assistant'
  content: string
  modelName?: string
  modelVersion?: string
  tokenUsage?: number
  generationTimeMs?: number
  callStatus: number
  isRetry: boolean
  createdAt: string
  /** 后端结构化富文本（11.2 契约）；存在时前端优先按块渲染 */
  richContent?: RichContent
}> {
  // 同 sendAIMessage：重新生成同样同步等待模型返回，沿用 65s 超时
  return request.post(
    `/ai/conversations/${conversationId}/messages/${messageId}/regenerate`,
    null,
    { timeout: 65_000 },
  )
}

/** 学生端常见问题（GET /ai/faqs；仅返回启用项，按 sort 升序） */
export interface AIFaqItem {
  id: number
  question: string
  sort: number
}

/**
 * 获取常见问题列表。
 * silent：失败时由聊天页静默隐藏快捷区，不弹全局错误提示，也不阻塞聊天主流程。
 */
export function getAIFaqs(): Promise<AIFaqItem[]> {
  return request
    .get('/ai/faqs', { silent: true } as RequestConfig)
    .then((data) => (Array.isArray(data) ? (data as AIFaqItem[]) : []))
}

/** 获取 AI 辅助建议（GET /ai/suggestions，按来源记录查询改进建议） */
export function getAISuggestions(params: {
  sourceType: 'archive' | 'career_plan' | 'weakness_analysis'
  sourceId: number
}): Promise<{ list: AISuggestion[] }> {
  return request.get('/ai/suggestions', { params })
}

/** 删除对话会话（DELETE /ai/conversations/{conversationId}） */
export function deleteAIConversation(conversationId: number): Promise<void> {
  // 删除必须让失败冒泡：调用方只有拿到成功结果后才能移除本地会话，
  // 否则会出现「本地删了、服务端还在、刷新复活」的伪删除。
  return request.delete(`/ai/conversations/${conversationId}`).then(() => undefined)
}

/**
 * 重命名对话会话（PUT /ai/conversations/{conversationId}）
 * 后端接口未实现时 catch 吞掉，调用方已乐观更新本地标题，不影响展示。
 */
export function renameAIConversation(
  conversationId: number,
  title: string,
): Promise<{ conversationId: number; title: string; updatedAt: string }> {
  return request.put(`/ai/conversations/${conversationId}`, { title })
}
