import type { RichContent } from '@/features/ai-chat/ai-chat.types'
import { describe, expect, it } from 'vitest'
import {
  parseMarkdownToRichContent,
  richToPlain,
  splitHighlight,
} from '@/features/ai-chat/utils/richText'

describe('richToPlain', () => {
  it('问候语单独一行，各块按类型转纯文本', () => {
    const rich: RichContent = {
      greeting: '你好',
      blocks: [
        { type: 'paragraph', text: '普通段落' },
        { type: 'list', items: [{ strong: '材料', text: '成绩单' }, { text: '无前缀项' }] },
        { type: 'steps', items: [{ num: 1, strong: '登录', text: '输入学号' }] },
        { type: 'card', title: '提示', body: '正文' },
      ],
    }

    expect(richToPlain(rich)).toBe(
      '你好\n普通段落\n材料 成绩单\n无前缀项\n1. 登录 — 输入学号\n【提示】正文',
    )
  })

  it('段落有 segments 时优先拼接 segments 文本', () => {
    const rich: RichContent = {
      blocks: [
        {
          type: 'paragraph',
          text: '原始**文本**',
          segments: [{ text: '原始' }, { text: '文本', bold: true }],
        },
      ],
    }

    expect(richToPlain(rich)).toBe('原始文本')
  })

  it('空内容返回空字符串（过滤空片段）', () => {
    expect(richToPlain({ blocks: [] })).toBe('')
  })
})

describe('splitHighlight', () => {
  it('无关键词或关键词全为空时返回整段非高亮', () => {
    expect(splitHighlight('abc')).toEqual([{ text: 'abc', isHighlight: false }])
    expect(splitHighlight('abc', [])).toEqual([{ text: 'abc', isHighlight: false }])
    expect(splitHighlight('abc', [''])).toEqual([{ text: 'abc', isHighlight: false }])
  })

  it('按出现位置切分并保留原文顺序', () => {
    expect(splitHighlight('申报表与成绩单', ['成绩单', '申报表'])).toEqual([
      { text: '申报表', isHighlight: true },
      { text: '与', isHighlight: false },
      { text: '成绩单', isHighlight: true },
    ])
  })

  it('长关键词优先，短关键词不重复切分重叠区间', () => {
    const segments = splitHighlight('申报表格式', ['申报', '申报表'])

    expect(segments).toEqual([
      { text: '申报表', isHighlight: true },
      { text: '格式', isHighlight: false },
    ])
  })

  it('无匹配时返回整段非高亮', () => {
    expect(splitHighlight('abc', ['x'])).toEqual([{ text: 'abc', isHighlight: false }])
  })

  it('同一关键词多次出现均被高亮', () => {
    const segments = splitHighlight('A B A', ['A'])

    expect(segments.filter((s) => s.isHighlight).map((s) => s.text)).toEqual(['A', 'A'])
  })
})

describe('parseMarkdownToRichContent', () => {
  it('标题解析为整体加粗段落', () => {
    const { blocks } = parseMarkdownToRichContent('## 申报须知')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ type: 'paragraph', text: '申报须知' })
    expect(blocks[0].type === 'paragraph' && blocks[0].segments?.[0].bold).toBe(true)
  })

  it('有序列表合并为 steps，并拆出加粗前缀', () => {
    const { blocks } = parseMarkdownToRichContent('1. **学业成绩**：如实填写\n2. 无前缀项')

    expect(blocks[0]).toMatchObject({
      type: 'steps',
      items: [
        { num: 1, strong: '学业成绩', text: '如实填写' },
        { num: 2, strong: '', text: '无前缀项' },
      ],
    })
  })

  it('无序列表合并为 list，并剥离行内加粗标记', () => {
    const { blocks } = parseMarkdownToRichContent(
      '- **材料**：成绩单\n- 普通项 **重点** 内容\n\n末尾段落',
    )

    expect(blocks[0]).toMatchObject({
      type: 'list',
      items: [{ strong: '材料', text: '成绩单' }, { text: '普通项 重点 内容' }],
    })
    expect(blocks[1]).toMatchObject({ type: 'paragraph' })
  })

  it('普通段落剥离 ** 标记并保留加粗片段', () => {
    const { blocks } = parseMarkdownToRichContent('请先阅读**申报须知**')

    expect(blocks[0].type).toBe('paragraph')
    expect(blocks[0].type === 'paragraph' && blocks[0].text).toBe('请先阅读申报须知')
    expect(blocks[0].type === 'paragraph' && blocks[0].segments).toEqual([
      { text: '请先阅读' },
      { text: '申报须知', bold: true },
    ])
  })

  it('空行与空文本不产生块', () => {
    expect(parseMarkdownToRichContent('\n\n  \n').blocks).toEqual([])
  })
})
