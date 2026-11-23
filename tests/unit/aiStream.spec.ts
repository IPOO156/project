// @vitest-environment jsdom
import type { AIStreamDonePayload } from '@/shared/api/ai-chat'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AIStreamPreflightError, sendAIMessageStream } from '@/shared/api/ai-chat'

/** 构造一个按给定片段依次下发的 SSE Response */
function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream;charset=UTF-8' },
  })
}

/** 收集回调的测试替身 */
function collectors() {
  const deltas: string[] = []
  const errors: string[] = []
  let done: AIStreamDonePayload | null = null
  return {
    handlers: {
      onDelta: (content: string) => deltas.push(content),
      onDone: (payload: AIStreamDonePayload) => {
        done = payload
      },
      onError: (message: string) => errors.push(message),
    },
    deltas,
    errors,
    getDone: () => done,
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('sendAIMessageStream', () => {
  it('跨 chunk 的不完整 data 行缓存到下一轮，delta 拼接与 done 字段正确', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse([
          'data:{"type":"start","conversationId":1}\n\ndata:{"type":"delta","content":"奖项',
          '申报"}\n\ndata:{"type":"delta","content":"需要材料"}\n\n',
          'data:{"type":"done","messageId":12,"role":"assistant","modelName":"glm-4-flash","tokenUsage":8}\n\n',
        ]),
      ),
    )
    const { handlers, deltas, errors, getDone } = collectors()

    await sendAIMessageStream(1, '奖项申报需要什么', handlers)

    expect(deltas.join('')).toBe('奖项申报需要材料')
    expect(errors).toEqual([])
    expect(getDone()?.messageId).toBe(12)
    expect(getDone()?.modelName).toBe('glm-4-flash')
  })

  it('前置校验失败（非 event-stream）抛出带状态码与后端 message 的错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ code: 30002, message: '会话不存在' }), {
            status: 404,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    )

    await expect(sendAIMessageStream(1, '问', collectors().handlers)).rejects.toMatchObject({
      name: 'AIStreamPreflightError',
      status: 404,
      message: '会话不存在',
    })
    await expect(sendAIMessageStream(1, '问', collectors().handlers)).rejects.toBeInstanceOf(
      AIStreamPreflightError,
    )
  })

  it('流内 error 事件回调提示且不触发 done', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        sseResponse([
          'data:{"type":"delta","content":"半句"}\n\n',
          'data:{"type":"error","message":"AI 服务暂时不可用，请稍后重试。"}\n\n',
        ]),
      ),
    )
    const { handlers, deltas, errors, getDone } = collectors()

    await sendAIMessageStream(1, '问', handlers)

    expect(deltas).toEqual(['半句'])
    expect(errors).toEqual(['AI 服务暂时不可用，请稍后重试。'])
    expect(getDone()).toBeNull()
  })
})
