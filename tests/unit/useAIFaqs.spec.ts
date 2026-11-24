import type { AIFaqItem } from '@/shared/api/ai-chat'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * useAIFaqs：学生端 AI 常见问题（GET /ai/faqs）
 *
 * 模块级缓存/并发去重依赖模块实例状态，故每个用例 vi.resetModules() 后动态
 * import，拿到全新的 module-level ref 与 inflight。
 */

const mocks = vi.hoisted(() => ({ getAIFaqs: vi.fn() }))

vi.mock('@/shared/api/ai-chat', () => ({ getAIFaqs: mocks.getAIFaqs }))

async function importComposable() {
  vi.resetModules()
  return import('@/views/school/ai-chat/composables/useAIFaqs')
}

beforeEach(() => {
  mocks.getAIFaqs.mockReset()
})

describe('toQuickQuestions', () => {
  it('映射为快捷问题结构，并过滤空白问题', async () => {
    const { toQuickQuestions } = await importComposable()

    expect(
      toQuickQuestions([
        { id: 1, question: '如何申请奖学金？', sort: 1 },
        { id: 2, question: '   ', sort: 2 },
        { id: 3, question: '如何查看成绩？', sort: 3 },
      ]),
    ).toEqual([
      { id: 1, label: '如何申请奖学金？', question: '如何申请奖学金？', icon: 'sparkles' },
      { id: 3, label: '如何查看成绩？', question: '如何查看成绩？', icon: 'sparkles' },
    ])
  })

  it('非数组入参归一为空列表（mock/网关异常返回对象时不崩溃）', async () => {
    const { toQuickQuestions } = await importComposable()

    expect(toQuickQuestions(null)).toEqual([])
    expect(toQuickQuestions(undefined)).toEqual([])
    expect(toQuickQuestions({} as unknown as AIFaqItem[])).toEqual([])
  })
})

describe('useAIFaqs', () => {
  it('首次 load 写入列表并缓存，后续调用不再请求', async () => {
    mocks.getAIFaqs.mockResolvedValue([{ id: 1, question: '如何申请奖学金？', sort: 1 }])
    const { useAIFaqs } = await importComposable()
    const { questions, loading, load } = useAIFaqs()

    await load()

    expect(mocks.getAIFaqs).toHaveBeenCalledTimes(1)
    expect(loading.value).toBe(false)
    expect(questions.value).toHaveLength(1)
    expect(questions.value[0]?.question).toBe('如何申请奖学金？')

    await load()
    expect(mocks.getAIFaqs).toHaveBeenCalledTimes(1)
  })

  it('空数组时保持空列表', async () => {
    mocks.getAIFaqs.mockResolvedValue([])
    const { useAIFaqs } = await importComposable()
    const { questions, load } = useAIFaqs()

    await load()

    expect(questions.value).toEqual([])
  })

  it('请求失败置空且不缓存，下次 load 可重试', async () => {
    mocks.getAIFaqs
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ id: 5, question: '如何补办学生证？', sort: 5 }])
    const { useAIFaqs } = await importComposable()
    const { questions, loading, load } = useAIFaqs()

    await load()
    expect(questions.value).toEqual([])
    expect(loading.value).toBe(false)

    await load()
    expect(mocks.getAIFaqs).toHaveBeenCalledTimes(2)
    expect(questions.value[0]?.question).toBe('如何补办学生证？')
  })

  it('并发 load 复用同一个 in-flight 请求', async () => {
    let resolveFn!: (list: AIFaqItem[]) => void
    mocks.getAIFaqs.mockReturnValueOnce(
      new Promise<AIFaqItem[]>((resolve) => {
        resolveFn = resolve
      }),
    )
    const { useAIFaqs } = await importComposable()
    const { questions, load } = useAIFaqs()

    const first = load()
    const second = load()
    expect(mocks.getAIFaqs).toHaveBeenCalledTimes(1)

    resolveFn([{ id: 9, question: '如何申请助学贷款？', sort: 9 }])
    await Promise.all([first, second])

    expect(questions.value[0]?.question).toBe('如何申请助学贷款？')
  })
})
