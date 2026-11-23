// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { watch } from 'vue'
import { createAIConversation, getAIConversations, sendAIMessageStream } from '@/shared/api/ai-chat'
import { useAIChat } from '@/views/school/ai-chat/composables/useAIChat'

vi.mock('@/shared/api/ai-chat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/ai-chat')>()
  return {
    ...actual,
    sendAIMessageStream: vi.fn(),
    createAIConversation: vi.fn(),
    getAIConversations: vi.fn(),
  }
})

const mockedStream = vi.mocked(sendAIMessageStream)
const mockedCreate = vi.mocked(createAIConversation)
const mockedList = vi.mocked(getAIConversations)

beforeEach(() => {
  mockedStream.mockReset()
  mockedCreate.mockResolvedValue({
    conversationId: 7,
    title: '测试会话',
    status: 1,
    createdAt: '2026-11-23T10:00:00+08:00',
  })
  mockedList.mockResolvedValue({
    total: 0,
    list: [],
    pagination: { page: 1, per_page: 50, total: 0, total_pages: 0 },
  })
})

describe('useAIChat 流式回复', () => {
  it('delta 逐段触发视图更新，done 回填真实 messageId 并结束流式态', async () => {
    mockedStream.mockImplementation(async (_cid, _content, handlers) => {
      handlers.onDelta('你好')
      handlers.onDelta('，世界')
      handlers.onDone({
        messageId: 42,
        role: 'assistant',
        modelName: 'glm-4-flash',
        createdAt: '2026-11-23T10:00:00+08:00',
      })
    })

    const chat = useAIChat()
    // flush: 'sync' 能感知每一次增量；若直接改 push 进去的原始对象，这里只会收到一次
    const seen: string[] = []
    watch(
      () => chat.messages.value[chat.messages.value.length - 1]?.content,
      (value) => {
        if (value != null) seen.push(value)
      },
      { flush: 'sync' },
    )

    await chat.sendMessage('测试')

    const ai = chat.messages.value[chat.messages.value.length - 1]
    expect(seen).toContain('你好')
    expect(seen).toContain('你好，世界')
    expect(ai.content).toBe('你好，世界')
    expect(ai.id).toBe('42')
    expect(ai.streaming).toBe(false)
    expect(ai.richContent).toBeTruthy()
    expect(chat.isStreaming.value).toBe(false)
    expect(chat.loading.value).toBe(false)
  })

  it('停止生成保留已收到的片段并标记「已停止」，不展示错误重试', async () => {
    mockedStream.mockImplementation(async (_cid, _content, handlers, signal) => {
      handlers.onDelta('半句')
      await new Promise<void>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          const error = new Error('aborted')
          error.name = 'AbortError'
          reject(error)
        })
      })
    })

    const chat = useAIChat()
    const pending = chat.sendMessage('测试停止')
    await vi.waitFor(() => {
      expect(chat.messages.value[chat.messages.value.length - 1]?.content).toBe('半句')
    })

    chat.stopGeneration()
    await pending

    const ai = chat.messages.value[chat.messages.value.length - 1]
    expect(ai.content).toBe('半句')
    expect(ai.stopped).toBe(true)
    expect(ai.failed).toBeUndefined()
    expect(chat.error.value).toBe(false)
    expect(chat.isStreaming.value).toBe(false)
    expect(chat.loading.value).toBe(false)
  })
})
