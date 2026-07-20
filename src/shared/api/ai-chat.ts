/**
 * AI 助手 API
 * 管理 AI 对话消息、对话历史、消息反馈
 *
 * 后端就绪后：
 *   - sendMessage        → request.post('/ai/chat', { message, conversationId, context })
 *   - getConversations    → request.get('/ai/conversations')
 *   - getConversation     → request.get(`/ai/conversations/${id}`)
 *   - createConversation  → request.post('/ai/conversations', { title })
 *   - deleteConversation  → request.delete(`/ai/conversations/${id}`)
 *   - submitFeedback      → request.post('/ai/feedback', { messageId, feedback, conversationId })
 */
import type { RichContent } from '@/features/ai-chat/types'
import { useArchiveStore, useCareerPlanStore } from '@/app/stores/stores'
import {
  analysisToRichBlocks,
  analyzeCareer,
} from '@/features/ai-chat/composables/useCareerAnalysis'
import { matchKnowledge } from '@/features/ai-chat/data/knowledgeBase'
import { richToPlain } from '@/features/ai-chat/utils/richText'

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

export interface ConversationDetail {
  id: string
  title: string
  messages: Array<{
    id: string
    role: 'user' | 'ai'
    content: string
    time: string
    richContent?: RichContent
    feedback?: 'useful' | 'useless' | null
  }>
  createTime: string
}

// ── Mock 辅助 ──
let convIdCounter = 0
const mockConversations = new Map<string, ConversationSummary>()
const mockMessages = new Map<string, ConversationDetail>()

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
          const { greeting, blocks } = analysisToRichBlocks(analysis)
          const rich: RichContent = { greeting, blocks }
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
                const { greeting, blocks } = analysisToRichBlocks(retry)
                const rich: RichContent = { greeting, blocks }
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

      // 同步更新 mock 对话存储
      if (!mockConversations.has(cid)) {
        const title = text.trim().slice(0, 14) + (text.trim().length > 14 ? '...' : '')
        mockConversations.set(cid, {
          id: cid,
          title,
          createTime: new Date().toLocaleString('zh-CN'),
          messageCount: 0,
        })
      }
      const conv = mockConversations.get(cid)!
      conv.messageCount += 2 // user + ai

      resolve({ message: msgResult, conversationId: cid })
    }, 800)
  })
}

/** 获取对话历史列表 */
export function getConversations(): Promise<ConversationSummary[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockConversations.values()])
    }, 200)
  })
}

/** 获取对话详情 */
export function getConversation(id: string): Promise<ConversationDetail | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMessages.get(id) ?? null)
    }, 200)
  })
}

/** 创建新对话 */
export function createConversation(title?: string): Promise<ConversationSummary> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = nextConvId()
      const conv: ConversationSummary = {
        id,
        title: title ?? '新对话',
        createTime: new Date().toLocaleString('zh-CN'),
        messageCount: 0,
      }
      mockConversations.set(id, conv)
      resolve(conv)
    }, 200)
  })
}

/** 删除对话 */
export function deleteConversation(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockConversations.delete(id)
      mockMessages.delete(id)
      resolve()
    }, 200)
  })
}

/** 提交消息反馈 */
export function submitFeedback(
  messageId: string,
  feedback: 'useful' | 'useless',
  conversationId?: string,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 同步到 mock 消息存储（如果有的话）
      if (conversationId && mockMessages.has(conversationId)) {
        const detail = mockMessages.get(conversationId)!
        const msg = detail.messages.find((m) => m.id === messageId)
        if (msg) msg.feedback = feedback
      }
      resolve()
    }, 200)
  })
}
