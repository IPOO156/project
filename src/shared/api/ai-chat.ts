/**
 * AI 助手 HTTP 接口（与《学生端接口文档》九、AI 对话模块一致）。
 *
 * 本文件只负责请求与响应类型，不包含任何业务编排：
 * 离线回退应答（依赖档案/职业规划 store 与知识库）在
 * `features/ai-chat/services/offlineChat.ts`，避免 shared 反向依赖上层。
 *
 * 真实后端接口：/ai/conversations、/ai/conversations/{id}/messages、
 * /ai/conversations/{id}/messages/{mid}/regenerate、/ai/suggestions、/ai/messages/{mid}/feedback、
 * DELETE /ai/conversations/{id}。
 */
import type { AISuggestion } from '@/features/ai-chat/ai-chat.types'
import request from './request'

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
  context?: Record<string, any>
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
}> {
  // 同 sendAIMessage：重新生成同样同步等待模型返回，沿用 65s 超时
  return request.post(
    `/ai/conversations/${conversationId}/messages/${messageId}/regenerate`,
    null,
    { timeout: 65_000 },
  )
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
  return request
    .delete(`/ai/conversations/${conversationId}`)
    .then(() => undefined)
    .catch(() => undefined)
}

/**
 * 重命名对话会话（PUT /ai/conversations/{conversationId}）
 * 后端接口未实现时 catch 吞掉，调用方已乐观更新本地标题，不影响展示。
 */
export function renameAIConversation(
  conversationId: number,
  title: string,
): Promise<{ id: number; title: string }> {
  return request.put(`/ai/conversations/${conversationId}`, { title })
}
