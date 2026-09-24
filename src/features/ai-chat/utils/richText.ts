/**
 * 富文本工具函数
 *
 * - richToPlain：将结构化 RichContent 转为纯文本摘要（用于 ChatMessage.content 字段 + 导出 TXT/MD）
 * - splitHighlight：将文本按高亮关键词切分为片段数组，供模板 v-for 渲染（避免模板内复杂正则表达式）
 * - parseMarkdownToRichContent：将后端返回的 markdown 字符串解析为 RichContent（过滤 ** / ## 等符号，
 *   支持加粗、标题、有序/无序列表），解决在线回复原始 markdown 符号直出问题
 */
import type { HighlightSegment, InlineSegment, RichBlock, RichContent } from '../types'

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
      // 有 segments 时取 segments 文本拼接（去加粗标记），否则取 text
      return block.segments?.length ? block.segments.map((s) => s.text).join('') : block.text
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

/* ===================== Markdown → RichContent 解析器 ===================== */

/**
 * 将行内 **bold** 解析为 InlineSegment[]，同时剥离所有 ** 标记。
 * 不成对的 ** 直接作为纯文本保留（避免误伤）。
 */
function parseInlineBold(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  const regex = /\*\*([^*]+)\*\*/g
  let last = 0
  let m = regex.exec(text)
  while (m !== null) {
    if (m.index > last) {
      segments.push({ text: text.slice(last, m.index) })
    }
    segments.push({ text: m[1], bold: true })
    last = regex.lastIndex
    m = regex.exec(text)
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last) })
  }
  // 解析失败回退：无匹配时返回原文本
  return segments.length ? segments : [{ text }]
}

/**
 * 解析整行 markdown 为一个段落块（处理行内 **bold**）
 */
function lineToParagraph(line: string): RichBlock {
  const segments = parseInlineBold(line)
  const plain = segments.map((s) => s.text).join('')
  return {
    type: 'paragraph',
    text: plain,
    segments,
  }
}

/**
 * 将后端返回的 markdown 文本解析为 RichContent。
 * 支持：## 标题（渲染为加粗段落）、**bold**（内联加粗）、1. 2. 有序列表（steps）、- 无序列表（list）
 * 过滤：##、**、-、数字序号等标记符号不直接显示
 */
export function parseMarkdownToRichContent(raw: string): RichContent {
  const blocks: RichBlock[] = []
  const lines = raw.split(/\r?\n/)

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trimEnd()
    const trimmed = line.trim()

    // 空行跳过
    if (!trimmed) {
      i++
      continue
    }

    // 标题：## text → 加粗段落
    const headingMatch = trimmed.match(/^#{1,6}\s+(\S.*)$/)
    if (headingMatch) {
      const segments = parseInlineBold(headingMatch[1])
      const plain = segments.map((s) => s.text).join('')
      blocks.push({
        type: 'paragraph',
        text: plain,
        // 标题整体加粗
        segments: segments.map((s) => ({ ...s, bold: true })),
      })
      i++
      continue
    }

    // 有序列表：1. xxx 2. xxx → steps 块
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(\S.*)$/)
    if (orderedMatch) {
      const items: Array<{ num: number; strong: string; text: string }> = []
      while (i < lines.length) {
        const cur = lines[i].trim()
        const m = cur.match(/^(\d+)\.\s+(\S.*)$/)
        if (!m) break
        const body = m[2]
        // 处理 **strong** — text 格式，如 **学业成绩**：如实填写...
        const strongMatch = body.match(/^\*\*([^*]+)\*\*[：:]\s*(\S.*)$/)
        if (strongMatch) {
          items.push({ num: Number(m[1]), strong: strongMatch[1], text: strongMatch[2] })
        } else {
          // 无加粗前缀，整体当 text，strong 留空字符串
          const segments = parseInlineBold(body)
          const plain = segments.map((s) => s.text).join('')
          items.push({ num: Number(m[1]), strong: '', text: plain })
        }
        i++
      }
      blocks.push({ type: 'steps', items })
      continue
    }

    // 无序列表：- xxx → list 块
    if (/^[-*]\s+/.test(trimmed)) {
      const items: Array<{ strong?: string; text: string }> = []
      while (i < lines.length) {
        const cur = lines[i].trim()
        const m = cur.match(/^[-*]\s+(\S.*)$/)
        if (!m) break
        const body = m[1]
        const strongMatch = body.match(/^\*\*([^*]+)\*\*[：:]\s*(\S.*)$/)
        if (strongMatch) {
          items.push({ strong: strongMatch[1], text: strongMatch[2] })
        } else {
          const segments = parseInlineBold(body)
          const plain = segments.map((s) => s.text).join('')
          items.push({ text: plain })
        }
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }

    // 普通段落（含行内 **bold**）
    blocks.push(lineToParagraph(trimmed))
    i++
  }

  return { blocks }
}
