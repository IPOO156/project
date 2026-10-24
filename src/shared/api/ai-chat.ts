/**
 * AI 助手 API
 * 管理 AI 对话会话、消息、AI 辅助建议（与《学生端接口文档》九、AI 对话模块一致）。
 *
 * 真实后端接口（主链路）：/ai/conversations、/ai/conversations/{id}/messages、
 * /ai/conversations/{id}/messages/{mid}/regenerate、/ai/suggestions、/ai/messages/{mid}/feedback、
 * DELETE /ai/conversations/{id}（见下方「后端 AI 接口」节）。
 *
 * 本地离线回退（非真实接口，仅在请求失败时兜底）：
 *   - sendMessage      → 基于知识库的本地应答，标注「离线模式」，不写任何本地"对话列表"伪数据
 * 旧 Mock getConversations/getConversation/createConversation/deleteConversation 已废弃删除。
 */
import type { AISuggestion, RichContent } from '@/features/ai-chat/ai-chat.types'
import { useArchiveStore, useCareerPlanStore } from '@/app/stores/stores'
import {
  analysisToRichBlocks,
  analyzeCareer,
} from '@/features/ai-chat/composables/useCareerAnalysis'
import { matchKnowledge } from '@/features/ai-chat/data/knowledgeBase'
import { richToPlain } from '@/features/ai-chat/utils/richText'

/* ===================== 后端 AI 接口（/ai/*，与文档九一致） ===================== */

import request from './request'

export interface SendMessageResult {
  message: {
    id: string
    role: 'ai'
    content: string
    time: string
    richContent?: RichContent
  }
  conversationId: string
}

export interface ConversationSummary {
  id: string
  title: string
  createTime: string
  messageCount: number
}

// ── 离线回退辅助（后端不可用时使用，不落库、不伪造列表数据）──
let convIdCounter = 0

function nextConvId(): string {
  return `conv_${++convIdCounter}`
}

function timeStr(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function simulateAIReply(userText: string): Promise<{ plain: string; rich: RichContent }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const entry = matchKnowledge(userText)

      if (entry.topic === '职业规划') {
        const archiveStore = useArchiveStore()
        const careerPlanStore = useCareerPlanStore()

        const analysis = analyzeCareer(
          archiveStore.dimensions,
          archiveStore.awards,
          archiveStore.grades,
          careerPlanStore.plans,
        )

        if (analysis) {
          careerPlanStore.setAIAnalysis(analysis)
          const { greeting, blocks, materials } = analysisToRichBlocks(analysis)
          const rich: RichContent = { greeting, blocks, materials }
          resolve({ plain: richToPlain(rich), rich })
          return
        }

        // 数据未就绪：先异步拉取档案数据，再重试一次分析
        if (archiveStore.dimensions.length === 0) {
          archiveStore
            .fetchArchive()
            .then(() => {
              const retry = analyzeCareer(
                archiveStore.dimensions,
                archiveStore.awards,
                archiveStore.grades,
                careerPlanStore.plans,
              )
              if (retry) {
                careerPlanStore.setAIAnalysis(retry)
                const { greeting, blocks, materials } = analysisToRichBlocks(retry)
                const rich: RichContent = { greeting, blocks, materials }
                resolve({ plain: richToPlain(rich), rich })
              } else {
                const plain = richToPlain(entry.rich)
                resolve({ plain, rich: entry.rich })
              }
            })
            .catch(() => {
              const plain = richToPlain(entry.rich)
              resolve({ plain, rich: entry.rich })
            })
          return
        }
      }

      const plain = richToPlain(entry.rich)
      resolve({ plain, rich: entry.rich })
    }, 800)
  })
}

// ── API 函数 ──

/** 发送消息，获取 AI 回复 */
export function sendMessage(
  text: string,
  conversationId?: string,
  _context?: Record<string, any>,
): Promise<SendMessageResult> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const cid = conversationId ?? nextConvId()
      const { plain, rich } = await simulateAIReply(text)
      const msgResult = {
        id: `ai-${Date.now()}`,
        role: 'ai' as const,
        content: plain,
        time: timeStr(),
        richContent: rich,
      }

      resolve({ message: msgResult, conversationId: cid })
    }, 800)
  })
}

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
