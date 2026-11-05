import type { RichContent } from '../ai-chat.types'
import { useArchiveStore, useCareerPlanStore } from '@/app/stores/stores'
import { analysisToRichBlocks, analyzeCareer } from '../composables/useCareerAnalysis'
import { matchKnowledge } from '../data/knowledgeBase'
import { richToPlain } from '../utils/richText'

/**
 * AI 助手「离线回退」应答。
 *
 * 为什么放在 features 而不是 shared/api：
 * 这段逻辑依赖 app 层 store（档案、职业规划）与 features 层的分析算法，
 * 属于业务编排而不是 HTTP 封装。shared/api 只保留真实接口调用，
 * 避免 shared 反向依赖上层（分层约束见 docs/architecture.md）。
 *
 * 仅在真实接口不可用时兜底：不落库、不伪造对话列表，回复标注「离线模式」。
 */
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

/** 离线回退：模拟一次 AI 回复（真实接口不可用时由 useAIChat 调用） */
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
