/**
 * 富文本工具函数
 *
 * - richToPlain：将结构化 RichContent 转为纯文本摘要（用于 ChatMessage.content 字段 + 导出 TXT/MD）
 * - splitHighlight：将文本按高亮关键词切分为片段数组，供模板 v-for 渲染（避免模板内复杂正则表达式）
 */
import type { HighlightSegment, RichBlock, RichContent } from '../types'

/**
 * 将富文本转为纯文本
 * - greeting 单独一行
 * - paragraph 原文
 * - list 每项「strong text」换行
 * - steps 每步「num. strong — text」换行
 * - card「【title】body」
 */
export function richToPlain(rich: RichContent): string {
  const parts: string[] = []
  if (rich.greeting) parts.push(rich.greeting)
  for (const block of rich.blocks) {
    parts.push(blockToText(block))
  }
  return parts.filter(Boolean).join('\n')
}

function blockToText(block: RichBlock): string {
  switch (block.type) {
    case 'paragraph':
      return block.text
    case 'list':
      return block.items.map((item) => `${item.strong ?? ''} ${item.text}`.trim()).join('\n')
    case 'steps':
      return block.items.map((step) => `${step.num}. ${step.strong} — ${step.text}`).join('\n')
    case 'card':
      return `【${block.title}】${block.body}`
    default:
      return ''
  }
}

/**
 * 将文本按高亮关键词切分为片段
 * - 无 highlights 或无匹配时返回 [{ text, isHighlight: false }]
 * - 多个关键词按出现位置切分，保留原文顺序
 * - 大小写敏感（中文场景无需忽略大小写）
 */
export function splitHighlight(text: string, highlights?: string[]): HighlightSegment[] {
  if (!highlights || highlights.length === 0) {
    return [{ text, isHighlight: false }]
  }

  // 过滤空关键词，按长度降序避免短词覆盖长词
  const validKeywords = highlights
    .filter((kw) => kw && kw.length > 0)
    .sort((a, b) => b.length - a.length)
  if (validKeywords.length === 0) {
    return [{ text, isHighlight: false }]
  }

  // 用占位符逐个标记关键词位置，避免重复切分
  const marks: Array<{ start: number; end: number }> = []
  const matched = new Set<string>()
  for (const kw of validKeywords) {
    if (matched.has(kw)) continue
    let idx = text.indexOf(kw)
    while (idx !== -1) {
      // 跳过已被更长关键词覆盖的区间
      const overlaps = marks.some((m) => idx < m.end && idx + kw.length > m.start)
      if (!overlaps) {
        marks.push({ start: idx, end: idx + kw.length })
        matched.add(kw)
      }
      idx = text.indexOf(kw, idx + kw.length)
    }
  }

  if (marks.length === 0) {
    return [{ text, isHighlight: false }]
  }

  marks.sort((a, b) => a.start - b.start)

  const segments: HighlightSegment[] = []
  let cursor = 0
  for (const mark of marks) {
    if (mark.start > cursor) {
      segments.push({ text: text.slice(cursor, mark.start), isHighlight: false })
    }
    segments.push({ text: text.slice(mark.start, mark.end), isHighlight: true })
    cursor = mark.end
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isHighlight: false })
  }
  return segments
}
